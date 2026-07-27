"use client";

import { ImagePlus } from "lucide-react";

// Miniatura del producto. Cuando no hay foto se deja el marco con el icono en
// gris: así la tabla no cambia de alto entre filas con y sin imagen.
export default function Thumb({ photo, size = "h-11 w-11" }) {
  return (
    <div
      className={`${size} shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50`}
    >
      {photo ? (
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-300">
          <ImagePlus className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
