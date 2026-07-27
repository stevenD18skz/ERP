"use client";

import { Loader2 } from "lucide-react";

// Confirmación de recibir o cancelar un pedido. Recibir es el único punto de la
// aplicación que sube stock desde Pedidos, así que se avisa explícitamente
// antes de hacerlo.
export default function StatusConfirmDialog({
  action,
  updating,
  onClose,
  onConfirm,
}) {
  const receiving = action === "recibir";
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
          {receiving
            ? "¿Marcar este pedido como recibido?"
            : "¿Cancelar este pedido?"}
        </div>
        <p className="text-sm leading-relaxed text-slate-500">
          {receiving
            ? "Se sumará al inventario el stock de cada producto del pedido."
            : "Esta acción no se puede deshacer."}
        </p>
        <div className="mt-1 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={updating}
            className="h-[46px] flex-1 rounded-lg border border-slate-200 text-[14.5px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={updating}
            className={`flex h-[46px] flex-1 items-center justify-center gap-2 rounded-lg text-[14.5px] font-bold text-white disabled:opacity-70 ${
              receiving
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {updating && <Loader2 className="h-4 w-4 animate-spin" />}
            {receiving ? "Marcar recibido" : "Cancelar pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}
