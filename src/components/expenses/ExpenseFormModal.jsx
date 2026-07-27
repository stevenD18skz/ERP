"use client";

import { Loader2, X } from "lucide-react";
import { KIND_META } from "./expensesUtils";

// Alta y edición de un movimiento. El mismo formulario sirve para los dos: lo
// distingue que el borrador traiga id o no.
export default function ExpenseFormModal({
  draft,
  onDraftChange,
  saving,
  onClose,
  onSubmit,
}) {
  const patch = (fields) => onDraftChange({ ...draft, ...fields });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-lg bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-800">
            {draft.id ? "Editar registro" : "Nuevo registro"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Tipo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(KIND_META).map(([k, meta]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => patch({ kind: k })}
                  className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                    draft.kind === k
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Fecha
              </label>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => patch({ date: e.target.value })}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Monto
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={draft.amount}
                onChange={(e) => patch({ amount: e.target.value })}
                placeholder="0"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Concepto
            </label>
            <input
              value={draft.concept}
              onChange={(e) => patch({ concept: e.target.value })}
              placeholder="Arriendo, servicios, transporte…"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Nota <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              value={draft.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
