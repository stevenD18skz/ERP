"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

/*
  El visor de la cámara con sus estados, sin nada alrededor.

  Lo comparten los dos lugares donde se lee con la cámara y que por fuera son
  distintos: el modal a pantalla completa (CameraScannerModal, con su título y
  su botón de cerrar) y la página del celular emparejado (/scan/[id], que en vez
  de cerrar muestra si el computador sigue del otro lado). Lo de adentro -el
  video, el marco, el aviso de "abriendo la cámara" y el de error- es idéntico
  en los dos, así que vive acá una sola vez.

  No llama a useCameraScanner: lo recibe ya llamado en `camera`. Así quien lo
  usa decide cuándo se prende y qué hacer con cada código, y además puede poner
  el botón de la linterna donde le sirva a su propio encabezado.
*/
export default function CameraViewport({ camera, notice, errorHint }) {
  const { videoRef, ready, error } = camera;

  return (
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

      {/* Arriba y no abajo: quien escanea suele tener el pulgar cerca del
          borde inferior sosteniendo el teléfono, y ahí mismo puede quedar
          tapado por la mano o por el teclado del sistema si estaba abierto. */}
      {notice && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-4">
          {notice}
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
          {/* Qué hacer en vez de esto, que cambia según dónde se esté: en el
              mostrador está el lector de teclado a mano, en el celular
              emparejado no. */}
          {errorHint && (
            <p className="max-w-sm text-xs leading-relaxed text-slate-500">
              {errorHint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
