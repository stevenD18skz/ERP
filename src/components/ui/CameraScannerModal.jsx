"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Flashlight,
  FlashlightOff,
  Loader2,
  X,
} from "lucide-react";

import { useCameraScanner } from "@/hooks/useCameraScanner";

/*
  La cámara del teléfono haciendo de lector, a pantalla completa.

  Dos modos, porque las dos pantallas que lo usan trabajan distinto:
  - `continuous={false}` (Productos): se lee un código y se cierra. Ahí lo que
    sigue es una ficha que hay que revisar, y dejar la cámara encendida encima
    solo estorbaría.
  - `continuous={true}` (Ventas): se queda abierta pasando mercancía. El cajero
    tiene la mano ocupada, y cerrar y volver a abrir por cada artículo sería
    más lento que teclear.
*/
export default function CameraScannerModal({
  onScan,
  onClose,
  continuous = false,
  title = "Escanear con la cámara",
}) {
  // Lo último leído, solo para confirmar en pantalla en el modo continuo.
  const [lastCode, setLastCode] = useState(null);

  const handleScan = (code) => {
    setLastCode(code);
    onScan(code);
    if (!continuous) onClose();
  };

  const { videoRef, ready, error, torchOn, torchAvailable, toggleTorch } =
    useCameraScanner({ active: true, onScan: handleScan });

  // Se escucha en captura y se corta la propagación: debajo hay modales que
  // también cierran con Escape, y aquí solo debe cerrarse la cámara.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[70] flex flex-col bg-slate-950"
    >
      <div className="flex shrink-0 items-center gap-2 px-3 py-3 sm:px-4">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
          {title}
        </p>

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

        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="Cerrar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {/* playsInline es obligatorio: sin él, algunos navegadores móviles se
            llevan el video a pantalla completa por su cuenta y tapan el resto
            de los controles. muted deja que empiece sin pedir permiso extra. */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />

        {/* Arriba y no abajo: quien escanea en el modo continuo (Ventas)
            suele tener el pulgar cerca del borde inferior sosteniendo el
            teléfono, y ahí mismo puede quedar tapada por la mano o el
            teclado del sistema si estaba abierto. */}
        {continuous && lastCode && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4">
            <p className="flex animate-fade-slide-up items-center gap-2 rounded-full bg-emerald-500/95 px-4 py-2 text-sm font-bold text-white shadow-lg">
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              Leído {lastCode}
            </p>
          </div>
        )}

        {!error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-40 w-[78%] max-w-sm rounded-2xl ring-2 ring-white/70">
              <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80" />
            </div>
          </div>
        )}

        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80 text-white">
            <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
            <p className="text-sm">Abriendo la cámara…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center">
            <AlertTriangle className="h-9 w-9 text-amber-400" aria-hidden />
            <p className="text-sm font-bold text-white">
              No se pudo usar la cámara
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-slate-300">
              {error.message}
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-slate-500">
              El lector de siempre sigue funcionando: escribe el código a mano o
              pásalo con el lector de teclado.
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-5 pt-3 text-center">
        <p className="text-xs leading-relaxed text-white/50">
          {continuous
            ? "Apunta al código. Puedes seguir pasando productos sin cerrar."
            : "Apunta al código de barras del producto."}
        </p>
      </div>
    </div>
  );
}
