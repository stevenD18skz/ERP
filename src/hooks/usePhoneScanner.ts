"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import {
  SCAN_EVENT,
  channelName,
  getOrCreateHostPairingId,
  hasPairedPhone,
  isPhoneScannerConfigured,
  markPhonePaired,
  newScanId,
  resetHostPairingId,
  type ScanPayload,
} from "@/lib/phoneScanner";

/*
  Los dos extremos del puente entre el celular y la pantalla del computador.

  Van sobre un canal de Supabase Realtime: el celular emite el código que leyó
  (broadcast) y cada lado anuncia que está ahí (presence), que es lo que
  permite mostrar "celular conectado" en vez de dejar a alguien esperando sin
  saber si el emparejamiento sirvió.

  Broadcast no guarda nada: lo que se emite mientras el otro lado no está
  escuchando se pierde, y está bien. Un código de barras solo tiene sentido en
  el momento en que se pasa la mercancía.
*/

export type LinkStatus =
  /** Falta configurar Supabase: no hay puente posible, esconder el botón. */
  | "unavailable"
  | "connecting"
  | "connected"
  /** El canal se cayó o no se pudo abrir. */
  | "error";

type PresenceMeta = { presence_ref: string; role?: string };

// Quién más está en el canal ahora mismo. Presence entrega un objeto con una
// entrada por conexión; acá solo interesa qué papeles hay.
function rolesInChannel(channel: RealtimeChannel): Set<string> {
  const state = channel.presenceState<PresenceMeta>();
  const roles = new Set<string>();
  for (const entries of Object.values(state)) {
    for (const entry of entries) {
      if (entry.role) roles.add(entry.role);
    }
  }
  return roles;
}

type UseChannelOptions = {
  pairingId: string | null;
  /** Qué es este extremo, para que el otro sepa que llegó. */
  role: "host" | "phone";
  /** El papel del otro extremo, el que se vigila para el indicador. */
  peerRole: "host" | "phone";
  enabled?: boolean;
  onScan?: (payload: ScanPayload) => void;
};

function usePhoneScannerChannel({
  pairingId,
  role,
  peerRole,
  enabled = true,
  onScan,
}: UseChannelOptions) {
  const [status, setStatus] = useState<LinkStatus>("connecting");
  const [peerPresent, setPeerPresent] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  // onScan suele llegar como función nueva en cada render; guardarla en un ref
  // evita rehacer la suscripción -y perder el emparejamiento un instante- cada
  // vez que la pantalla se redibuja.
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  // El último envío procesado. Broadcast puede entregar el mismo mensaje dos
  // veces al reconectar; el mismo CÓDIGO repetido sí es legítimo (dos unidades
  // del mismo producto), por eso se compara el id del envío y no el código.
  const lastScanIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !pairingId) return;
    if (!isPhoneScannerConfigured) {
      setStatus("unavailable");
      return;
    }

    setStatus("connecting");
    setPeerPresent(false);

    // Lo que se lleva los 66 kB, pedido acá y no arriba: hasta que alguien no
    // usa el celular de verdad, Ventas y Productos no lo bajan.
    let cancelled = false;
    let client: SupabaseClient | null = null;
    let channel: RealtimeChannel | null = null;

    (async () => {
      const { supabase } = await import("@/lib/supabaseClient");
      // Entre el import() y este punto pudo cerrarse la pantalla; abrir el
      // canal ahora dejaría una conexión que ya nadie va a cerrar.
      if (cancelled) return;
      if (!supabase) {
        setStatus("unavailable");
        return;
      }

      client = supabase;
      channel = supabase.channel(channelName(pairingId), {
        config: {
          // Cada conexión con su propia llave: si se abren dos pestañas del
          // mismo lado, ninguna pisa la presencia de la otra.
          presence: { key: `${role}-${newScanId()}` },
          // ack para que quien emite sepa de verdad si el mensaje salió, y no
          // tenga que confiar en que sí.
          broadcast: { ack: true },
        },
      });
      channelRef.current = channel;

      channel.on("broadcast", { event: SCAN_EVENT }, ({ payload }) => {
        const scan = payload as ScanPayload;
        if (!scan?.code) return;
        if (scan.id && scan.id === lastScanIdRef.current) return;
        lastScanIdRef.current = scan.id ?? null;
        onScanRef.current?.(scan);
      });

      const syncPeer = () => {
        if (channel) setPeerPresent(rolesInChannel(channel).has(peerRole));
      };
      channel.on("presence", { event: "sync" }, syncPeer);
      channel.on("presence", { event: "join" }, syncPeer);
      channel.on("presence", { event: "leave" }, syncPeer);

      channel.subscribe((state) => {
        if (state === "SUBSCRIBED") {
          setStatus("connected");
          channel?.track({ role });
        } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
          setStatus("error");
          setPeerPresent(false);
        }
      });
    })();

    return () => {
      cancelled = true;
      channelRef.current = null;
      lastScanIdRef.current = null;
      if (client && channel) client.removeChannel(channel);
    };
  }, [pairingId, role, peerRole, enabled]);

  const send = useCallback(async (code: string): Promise<boolean> => {
    const channel = channelRef.current;
    if (!channel) return false;
    const payload: ScanPayload = { code, id: newScanId() };
    try {
      const result = await channel.send({
        type: "broadcast",
        event: SCAN_EVENT,
        payload,
      });
      return result === "ok";
    } catch {
      return false;
    }
  }, []);

  return { status, peerPresent, send };
}

/*
  Lado computador. Se monta en la pantalla completa (Ventas, Productos) y no
  solo mientras el modal del QR está abierto: una vez emparejado, quien atiende
  levanta el celular, escanea y el producto entra: sin abrir nada antes. El
  modal queda solo para emparejar la primera vez y para ver el estado.
*/
export function usePhoneScannerHost({
  pairingId,
  enabled = true,
  onScan,
}: {
  pairingId: string | null;
  enabled?: boolean;
  onScan: (code: string) => void;
}) {
  const handleScan = useCallback(
    (payload: ScanPayload) => onScan(payload.code),
    [onScan],
  );

  const { status, peerPresent } = usePhoneScannerChannel({
    pairingId,
    role: "host",
    peerRole: "phone",
    enabled,
    onScan: handleScan,
  });

  return { status, phoneConnected: peerPresent };
}

/*
  Lo que usan las pantallas (Ventas, Productos): el emparejamiento de este
  computador, el estado del puente y el botón para romperlo, todo resuelto.

  Cuándo se abre el canal:
  - Si ya hubo un celular emparejado acá, apenas carga la pantalla. Es lo que
    permite levantar el teléfono y escanear sin abrir nada antes.
  - Si nunca lo hubo, solo mientras el modal del QR esté abierto. Así una
    tienda que no usa el atajo no deja una conexión permanente abierta.
*/
export function usePhoneScannerLink({
  onScan,
  pairing = false,
}: {
  onScan: (code: string) => void;
  /** Si el modal del QR está abierto ahora mismo. */
  pairing?: boolean;
}) {
  // Ambos arrancan apagados y se resuelven al montar: localStorage no existe
  // en el servidor, y el botón no debe aparecer en el HTML del servidor para
  // luego cambiar en el navegador (desajuste de hidratación).
  const [pairingId, setPairingId] = useState<string | null>(null);
  const [everPaired, setEverPaired] = useState(false);

  useEffect(() => {
    setPairingId(getOrCreateHostPairingId());
    setEverPaired(hasPairedPhone());
  }, []);

  const { status, phoneConnected } = usePhoneScannerHost({
    pairingId,
    enabled: pairing || everPaired,
    onScan,
  });

  // La primera vez que se ve un celular del otro lado queda anotado, para que
  // a partir de la próxima carga el canal se abra solo.
  useEffect(() => {
    if (!phoneConnected || everPaired) return;
    markPhonePaired();
    setEverPaired(true);
  }, [phoneConnected, everPaired]);

  const reset = useCallback(() => {
    setPairingId(resetHostPairingId());
    setEverPaired(false);
  }, []);

  return {
    pairingId,
    status,
    phoneConnected,
    reset,
    /** Si tiene sentido ofrecer el atajo en esta pantalla. */
    available: pairingId !== null && isPhoneScannerConfigured,
  };
}

/* Lado celular: la página /scan/[id]. Emite y vigila que la pantalla siga ahí. */
export function usePhoneScannerClient({
  pairingId,
  enabled = true,
}: {
  pairingId: string | null;
  enabled?: boolean;
}) {
  const { status, peerPresent, send } = usePhoneScannerChannel({
    pairingId,
    role: "phone",
    peerRole: "host",
    enabled,
  });

  return { status, desktopConnected: peerPresent, sendCode: send };
}
