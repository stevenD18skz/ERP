"use client";

import { Trash2 } from "lucide-react";

// Barra que aparece al seleccionar filas. Va sticky bajo la barra superior para
// que siga a la vista mientras se recorre la tabla marcando productos.
export default function SelectionBar({ count, onClear, onDelete }) {
  if (count === 0) return null;
  return (
    <div className="sticky top-16 z-20 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-700 px-4 py-3 text-white shadow-lg">
      <span className="text-sm font-bold">
        {count} seleccionado{count > 1 ? "s" : ""}
      </span>
      <div className="flex items-center gap-2.5">
        <button
          onClick={onClear}
          className="rounded-lg bg-white/15 px-3.5 py-2 text-sm font-semibold text-white hover:bg-white/25"
        >
          Cancelar
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4" /> Eliminar seleccionados
        </button>
      </div>
    </div>
  );
}
