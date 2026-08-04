"use client";

import { RotateCcw } from "lucide-react";
import CreatableSelect from "@/components/ui/CreatableSelect";

// Proveedor, fecha de entrega y notas: el encabezado del pedido.
//
// El proveedor es un select con creación (igual que categoría/marca en
// Productos): se elige uno ya guardado o se escribe uno nuevo, que se crea
// junto con el pedido. `supplier` viaja como { id, name } | null.
export default function OrderHeaderForm({
  supplier,
  onSupplierChange,
  suppliers,
  onRenameSupplier,
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
      <div>
        <label
          htmlFor="order-supplier"
          className="mb-1.5 block text-sm font-bold text-slate-900"
        >
          Proveedor <span className="text-red-500">*</span>
        </label>
        <CreatableSelect
          id="order-supplier"
          value={supplier}
          onChange={onSupplierChange}
          onRename={onRenameSupplier}
          options={suppliers}
          placeholder="Elige o crea un proveedor"
        />
        {errors.supplier && (
          <div className="mt-1.5 text-xs font-semibold text-red-600">
            {errors.supplier}
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
