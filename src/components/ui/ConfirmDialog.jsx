"use client";

import { AlertTriangle } from "lucide-react";

// Diálogo de "¿seguro?" para acciones que no se pueden deshacer.
export default function ConfirmDialog({
  title = "Confirmar",
  description = "¿Estás seguro?",
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  onClose,
  onConfirm,
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-fade-slide-up rounded-lg bg-white p-5 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h4 className="font-semibold text-slate-800">{title}</h4>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
