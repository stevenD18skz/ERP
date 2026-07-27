"use client";

import { currency } from "@/utils/converts";
import { formatDate } from "./expensesUtils";

// Se repite el registro completo (concepto, fecha y monto) en vez de un
// "¿seguro?" genérico: con 25 filas iguales en pantalla es fácil haber tocado
// el botón equivocado.
export default function DeleteExpenseDialog({ item, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h2 className="font-semibold text-slate-800">Eliminar registro</h2>
        <p className="mt-2 text-sm text-slate-600">
          Se va a borrar <strong>{item.concept}</strong> del{" "}
          {formatDate(item.date)} por {currency(item.amount)}. No se puede
          deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
