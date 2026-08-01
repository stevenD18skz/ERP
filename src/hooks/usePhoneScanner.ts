"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

import {
  IDLE_TIMEOUT_MS,
  SCAN_EVENT,
  STOP_EVENT,
  channelName,
  getOrCreateHostPairingId,
  hasPairedPhone,
  isPhoneScannerConfigured,
  markPhonePaired,
  newScanId,
  resetHostPairingId,
  type ScanPayload,
  type StopPayload,
  type StopReason,
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
  /** Solo lo usa el celular: el computador avisando que ya puede apagar. */
  onStop?: (payload: StopPayload) => void;
};

function usePhoneScannerChannel({
  pairingId,
  role,
  peerRole,
  enabled = true,
  onScan,
  onStop,
}: UseChannelOptions) {
  const [status, setStatus] = useState<LinkStatus>("connecting");
  const [peerPresent, setPeerPresent] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  // onScan suele llegar como función nueva en cada render; guardarla en un ref
  // evita rehacer la suscripción -y perder el emparejamiento un instante- cada
  // vez que la pantalla se redibuja.
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;
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

      channel.on("broadcast", { event: STOP_EVENT }, ({ payload }) => {
        onStopRef.current?.(payload as StopPayload);
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

  const emit = useCallback(
    async (event: string, payload: unknown): Promise<boolean> => {
      const channel = channelRef.current;
      if (!channel) return false;
      try {
        const result = await channel.send({
          type: "broadcast",
          event,
          payload,
        });
        return result === "ok";
      } catch {
        return false;
      }
    },
    [],
  );

  return { status, peerPresent, emit };
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

  const { status, peerPresent, emit } = usePhoneScannerChannel({
    pairingId,
    role: "host",
    peerRole: "phone",
    enabled,
    onScan: handleScan,
  });

  // Apagar la cámara del celular desde acá. El teléfono no puede saber solo
  // que el trabajo terminó: eso solo lo sabe la pantalla que recibió el código.
  const stopPhone = useCallback(
    (reason: StopReason) => {
      const payload: StopPayload = { reason };
      return emit(STOP_EVENT, payload);
    },
    [emit],
  );

  return { status, phoneConnected: peerPresent, stopPhone };
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
  active = true,
  onIdle,
}: {
  onScan: (code: string) => void;
  /** Si el modal del QR está abierto ahora mismo. */
  pairing?: boolean;
  /**
   * Compuerta de afuera, para cuando la pantalla tiene más de un sitio que
   * escucha. En Productos el escaneo suelto se apaga mientras hay un modal
   * abierto, porque ese modal trae el suyo propio; es el mismo trato que ya
   * tiene el lector de teclado (ver el enabled de useBarcodeScanner allá).
   * Con dos escuchando el mismo canal, un código entraría dos veces.
   */
  active?: boolean;
  /**
   * Se llama cuando pasa IDLE_TIMEOUT_MS con el celular conectado y sin leer
   * nada. La cámara del teléfono ya se apagó por su cuenta para entonces; esto
   * es para que la pantalla cierre el modal y lo diga.
   */
  onIdle?: () => void;
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

  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;
  // stopPhone nace del hook de abajo, que a su vez necesita handleScan: se
  // guarda en un ref para poder llamarlo desde el temporizador sin pelear con
  // el orden en que se declaran.
  const stopPhoneRef = useRef<((reason: StopReason) => unknown) | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
  }, []);

  // Se rearma con cada lectura, así que el reloj cuenta desde el último código
  // y no desde que se conectó el teléfono.
  const armIdle = useCallback(() => {
    clearIdle();
    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null;
      // El celular ya se apagó solo con su propio reloj; este aviso es el
      // respaldo para cuando el suyo no llegó a correr.
      stopPhoneRef.current?.("idle");
      onIdleRef.current?.();
    }, IDLE_TIMEOUT_MS);
  }, [clearIdle]);

  const handleScan = useCallback(
    (code: string) => {
      armIdle();
      onScanRef.current(code);
    },
    [armIdle],
  );

  const { status, phoneConnected, stopPhone } = usePhoneScannerHost({
    pairingId,
    enabled: active && (pairing || everPaired),
    onScan: handleScan,
  });
  stopPhoneRef.current = stopPhone;

  // El reloj solo corre mientras hay un celular del otro lado: sin nadie
  // conectado no hay cámara que apagar ni modal que cerrar.
  useEffect(() => {
    if (!phoneConnected) {
      clearIdle();
      return;
    }
    armIdle();
    return clearIdle;
  }, [phoneConnected, armIdle, clearIdle]);

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
    /**
     * Apaga la cámara del celular. Lo usa Productos apenas entra un código:
     * ahí un escaneo es todo el trabajo, y lo que sigue es revisar la ficha en
     * el computador.
     */
    stopPhone,
    /** Si tiene sentido ofrecer el atajo en esta pantalla. */
    available: pairingId !== null && isPhoneScannerConfigured,
  };
}

/* Lado celular: la página /scan/[id]. Emite y vigila que la pantalla siga ahí. */
export function usePhoneScannerClient({
  pairingId,
  enabled = true,
  onStop,
}: {
  pairingId: string | null;
  enabled?: boolean;
  /** El computador avisa que ya se puede apagar la cámara. */
  onStop?: (reason: StopReason) => void;
}) {
  const handleStop = useCallback(
    (payload: StopPayload) => onStop?.(payload?.reason ?? "done"),
    [onStop],
  );

  const { status, peerPresent, emit } = usePhoneScannerChannel({
    pairingId,
    role: "phone",
    peerRole: "host",
    enabled,
    onStop: handleStop,
  });

  const sendCode = useCallback(
    (code: string) => emit(SCAN_EVENT, { code, id: newScanId() } as ScanPayload),
    [emit],
  );

  return { status, desktopConnected: peerPresent, sendCode };
}
