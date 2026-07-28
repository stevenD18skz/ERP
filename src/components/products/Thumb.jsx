"use client";

import { ImagePlus, Maximize2 } from "lucide-react";

// Miniatura del producto. Cuando no hay foto se deja el marco con el icono en
// gris: así la tabla no cambia de alto entre filas con y sin imagen.
//
// Con `onZoom` y foto, la miniatura pasa a ser un botón que abre el visor. Sin
// una de las dos cosas se queda como estaba: un marco que no se puede tocar,
// porque no habría nada que mostrar en grande.
export default function Thumb({ photo, size = "h-11 w-11", onZoom, label }) {
  const frame = `${size} shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50`;

  if (!photo) {
    return (
      <div className={frame}>
        <div className="flex h-full w-full items-center justify-center text-slate-300">
          <ImagePlus className="h-4 w-4" />
        </div>
      </div>
    );
  }

  if (!onZoom) {
    return (
      <div className={frame}>
        <img src={photo} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onZoom}
      aria-label={label ? `Ver la foto de ${label}` : "Ver la foto"}
      className={`${frame} group relative cursor-zoom-in transition-colors hover:border-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
    >
      <img src={photo} alt="" className="h-full w-full object-cover" />
      {/* La lupa solo se insinúa al pasar por encima: en una tabla de ocho
          filas, ocho iconos fijos encima de las fotos son ruido. */}
      <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition-opacity group-hover:bg-slate-900/40 group-hover:opacity-100 group-focus-visible:bg-slate-900/40 group-focus-visible:opacity-100">
        <Maximize2 className="h-4 w-4 text-white" aria-hidden />
      </span>
    </button>
  );
}
