"use client";

import { X } from "lucide-react";

// Etiqueta de filtro activo, con su propia X para quitarlo.
export default function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-2.5 pr-1.5 text-xs font-medium text-blue-700">
      {label}
      <button
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="rounded-full p-0.5 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
