"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Flashlight,
  FlashlightOff,
  Loader2,
  Smartphone,
  WifiOff,
} from "lucide-react";

import CameraViewport from "@/components/ui/CameraViewport";
import { useCameraScanner } from "@/hooks/useCameraScanner";
import { usePhoneScannerClient } from "@/hooks/usePhoneScanner";
import { rememberClientPairingId } from "@/lib/phoneScanner";

/*
  El celular haciendo de lector para la pantalla del computador.

  Es una página pública a propósito: entra desde otro navegador (se apunta el
  QR con el teléfono, no se comparte la sesión) y no tendría la cookie de la
  tienda. Puede serlo porque no lee ni escribe nada del negocio -no hay
  productos, ni precios, ni ventas acá- : abre la cámara y emite al canal el
  código que leyó. Quién la recibe lo decide el identificador del
  emparejamiento, que va en la dirección y es un UUID aleatorio.

  La página no busca el producto ni decide nada: eso pasa del otro lado, en la
  pantalla que ya tiene el catálogo cargado y la sesión abierta. Acá solo se
  lee y se manda, igual que haría un lector de mano.
*/

const STATUS_STYLES = {
  connected: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  waiting: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  broken: "bg-red-500/15 text-red-300 ring-red-500/30",
};

export default function PhoneScannerPage() {
  const { id } = useParams();
  const pairingId = typeof id === "string" ? id : null;

  // Lo último que se intentó mandar, para poder confirmar en pantalla. Quien
  // escanea está mirando la mercancía, no el teléfono: el aviso tiene que
  // decir si el código llegó de verdad, no solo que se leyó.
  const [lastSent, setLastSent] = useState(null);
  const [sentCount, setSentCount] = useState(0);

  const { status, desktopConnected, sendCode } = usePhoneScannerClient({
    pairingId,
  });

  // Se recuerda el emparejamiento apenas se abre: la próxima vez basta entrar
  // a /scan y este teléfono vuelve solo a la misma pantalla, sin repetir el QR.
  useEffect(() => {
    if (pairingId) rememberClientPairingId(pairingId);
  }, [pairingId]);

  const handleScan = useCallback(
    async (code) => {
      setLastSent({ code, state: "sending" });
      const ok = await sendCode(code);
      setLastSent({ code, state: ok ? "sent" : "failed" });
      if (ok) setSentCount((n) => n + 1);
    },
    [sendCode],
  );

  const camera = useCameraScanner({ active: true, onScan: handleScan });
  const { torchOn, torchAvailable, toggleTorch } = camera;

  // Sin esto la pantalla se apaga sola a los treinta segundos y hay que
  // despertarla en cada producto, que es justo lo que este atajo venía a
  // evitar. No todos los navegadores la traen; donde no esté, se sigue igual.
  useEffect(() => {
    let lock = null;
    let cancelled = false;

    const acquire = async () => {
      if (!navigator.wakeLock) return;
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        /* el navegador la negó: la pantalla se apagará como siempre */
      }
    };

    // El bloqueo se suelta solo al pasar la pestaña a segundo plano, así que
    // hay que volver a pedirlo al regresar.
    const onVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      lock?.release().catch(() => {});
    };
  }, []);

  const link =
    status === "error" || status === "unavailable"
      ? {
          tone: "broken",
          icon: WifiOff,
          text:
            status === "unavailable"
              ? "Sin conexión con el servidor"
              : "Se perdió la conexión",
        }
      : status === "connecting"
        ? { tone: "waiting", icon: Loader2, text: "Conectando…", spin: true }
        : desktopConnected
          ? { tone: "connected", icon: Check, text: "Conectado al computador" }
          : {
              tone: "waiting",
              icon: AlertTriangle,
              text: "El computador no está escuchando",
            };

  const LinkIcon = link.icon;

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950">
      <div className="flex shrink-0 items-center gap-2 px-3 py-3 sm:px-4">
        <span
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${STATUS_STYLES[link.tone]}`}
        >
          <LinkIcon
            className={`h-3.5 w-3.5 shrink-0 ${link.spin ? "animate-spin" : ""}`}
            aria-hidden
          />
          <span className="truncate">{link.text}</span>
        </span>

        {torchAvailable && (
          <button
            type="button"
            onClick={toggleTorch}
            aria-pressed={torchOn}
            aria-label={torchOn ? "Apagar la linterna" : "Prender la linterna"}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              torchOn
                ? "bg-amber-400 text-slate-900"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            {torchOn ? (
              <Flashlight className="h-5 w-5" aria-hidden />
            ) : (
              <FlashlightOff className="h-5 w-5" aria-hidden />
            )}
          </button>
        )}
      </div>

      <CameraViewport
        camera={camera}
        errorHint="Sin cámara este teléfono no puede servir de lector. En el computador puedes seguir escribiendo el código a mano."
        notice={
          lastSent ? (
            lastSent.state === "failed" ? (
              <p className="flex animate-fade-slide-up items-center gap-2 rounded-full bg-red-500/95 px-4 py-2 text-sm font-bold text-white shadow-lg">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                No se pudo enviar {lastSent.code}
              </p>
            ) : lastSent.state === "sending" ? (
              <p className="flex items-center gap-2 rounded-full bg-slate-800/95 px-4 py-2 text-sm font-bold text-white shadow-lg">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                Enviando {lastSent.code}
              </p>
            ) : (
              <p className="flex animate-fade-slide-up items-center gap-2 rounded-full bg-emerald-500/95 px-4 py-2 text-sm font-bold text-white shadow-lg">
                <Check className="h-4 w-4 shrink-0" aria-hidden />
                Enviado {lastSent.code}
              </p>
            )
          ) : null
        }
      />

      <div className="shrink-0 px-4 pb-5 pt-3 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs leading-relaxed text-white/50">
          <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {sentCount > 0
            ? `${sentCount} ${sentCount === 1 ? "código enviado" : "códigos enviados"} · sigue pasando productos`
            : "Apunta al código de barras. Cada lectura entra en el computador."}
        </p>
      </div>
    </div>
  );
}
