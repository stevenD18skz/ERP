"use client";

import { RotateCcw } from "lucide-react";

// Proveedor, fecha de entrega y notas: el encabezado del pedido.
//
// Las sugerencias de proveedor usan onMouseDown con preventDefault en vez de
// onClick: el clic normal llega después del blur del input, que ya cerró la
// lista, y el botón nunca alcanzaba a dispararse.
export default function OrderHeaderForm({
  supplier,
  onSupplierChange,
  supplierSuggestions,
  onPickSupplier,
  showRepeatLast,
  lastOrderItemCount,
  onRepeatLast,
  expectedDelivery,
  onExpectedDeliveryChange,
  notes,
  onNotesChange,
  errors,
}) {
  const fieldClass = (invalid) =>
    `h-[46px] w-full rounded-lg border px-3.5 text-[15px] outline-none focus:ring-2 ${
      invalid
        ? "border-red-400 focus:ring-red-100"
        : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
    }`;

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-[18px] shadow-sm ring-1 ring-slate-100">
      <div className="relative">
        <label className="mb-1.5 block text-sm font-bold text-slate-900">
          Proveedor <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={supplier}
          onChange={(e) => onSupplierChange(e.target.value)}
          placeholder="Escribe o elige un proveedor"
          aria-invalid={!!errors.supplier}
          className={fieldClass(errors.supplier)}
        />
        {errors.supplier && (
          <div className="mt-1.5 text-xs font-semibold text-red-600">
            {errors.supplier}
          </div>
        )}
        {supplierSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-[74px] z-10 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            {supplierSuggestions.map((name) => (
              <button
                key={name}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPickSupplier(name);
                }}
                className="block w-full border-b border-slate-100 px-3.5 py-2.5 text-left text-[14.5px] font-semibold text-slate-900 last:border-0 hover:bg-slate-50"
              >
                {name}
              </button>
            ))}
          </div>
        )}
        {showRepeatLast && (
          <button
            type="button"
            onClick={onRepeatLast}
            className="mt-2.5 flex h-[38px] items-center gap-2 rounded-full bg-indigo-50 px-3.5 text-[13px] font-bold text-indigo-700 hover:bg-indigo-100"
          >
            <RotateCcw className="h-[15px] w-[15px]" />
            Repetir último pedido ({lastOrderItemCount} productos)
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3.5">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1.5 block text-sm font-bold text-slate-900">
            Fecha de entrega esperada <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={expectedDelivery}
            onChange={(e) => onExpectedDeliveryChange(e.target.value)}
            aria-invalid={!!errors.fecha}
            className={fieldClass(errors.fecha)}
          />
          {errors.fecha && (
            <div className="mt-1.5 text-xs font-semibold text-red-600">
              {errors.fecha}
            </div>
          )}
        </div>
        <div className="min-w-[220px] flex-[2]">
          <label className="mb-1.5 block text-sm font-bold text-slate-900">
            Notas (opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Ej. Entregar en la mañana"
            className="h-[46px] w-full rounded-lg border border-slate-200 px-3.5 text-[15px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>
    </div>
  );
}
