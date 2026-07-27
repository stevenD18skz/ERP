"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// Barra de paginación con el formato que se pidió conservar:
// "Mostrando X - Y de Z" a la izquierda y Anterior / pág. / Siguiente a la
// derecha.
export default function Pagination({ page, totalPages, perPage, total, onPageChange }) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-600">
        Mostrando {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)} -{" "}
        {Math.min(page * perPage, total)} de {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <div className="px-2 py-1 text-sm tabular-nums text-slate-600">
          {page} / {totalPages}
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
