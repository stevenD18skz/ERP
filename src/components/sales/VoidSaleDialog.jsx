"use client";

import { Loader2 } from "lucide-react";

// Anular devuelve el stock vendido al inventario, así que se avisa antes: no
// es lo mismo que corregir una cifra.
export default function VoidSaleDialog({ voiding, onClose, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-3.5 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="text-lg font-extrabold text-slate-900">
          ¿Anular esta venta?
        </div>
        <p className="text-sm leading-relaxed text-slate-500">
          El stock vendido se devolverá al inventario. Esta acción no se puede
          deshacer.
        </p>
        <div className="mt-1 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={voiding}
            className="h-[46px] flex-1 rounded-lg border border-slate-200 text-[14.5px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={voiding}
            className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 text-[14.5px] font-bold text-white hover:bg-red-700 disabled:opacity-70"
          >
            {voiding && <Loader2 className="h-4 w-4 animate-spin" />}
            Anular venta
          </button>
        </div>
      </div>
    </div>
  );
}
