"use client";

import { Minus, Plus, Trash2, Truck } from "lucide-react";
import { currency } from "@/utils/converts";

// Líneas del pedido. A diferencia de Ventas no hay tope de cantidad: acá se
// está pidiendo mercancía que todavía no existe en el estante, así que limitar
// por el stock actual no tendría sentido.
export default function OrderLines({
  lines,
  qtyRefs,
  onQtyChange,
  onQtyStep,
  onQtyKeyDown,
  onRemove,
}) {
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2.5 rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Truck className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-[16px] font-bold text-slate-900">
          Aún no agregas productos
        </p>
        <p className="text-sm text-slate-500">
          Busca el producto que quieres pedirle al proveedor.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-100">
      {lines.map((line) => (
        <div
          key={line._key}
          className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 p-3 last:border-0"
        >
          <div className="min-w-[140px] flex-1">
            <div className="text-[15px] font-bold text-slate-900">
              {line.name}
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              SKU {line.sku} · {currency(line.unitCost)} c/u
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Restar"
              onClick={() => onQtyStep(line._key, -1)}
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              ref={(el) => (qtyRefs.current[line._key] = el)}
              type="number"
              min="1"
              value={line.quantity}
              onChange={(e) => onQtyChange(line._key, e.target.value)}
              onKeyDown={onQtyKeyDown}
              aria-label={`Cantidad de ${line.name}`}
              className="no-spinner h-[30px] w-14 rounded-md border border-slate-200 text-center text-sm font-bold tabular-nums text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              aria-label="Sumar"
              onClick={() => onQtyStep(line._key, 1)}
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="w-[110px] shrink-0 text-right text-[15px] font-bold tabular-nums text-slate-900">
            {currency(line.unitCost * line.quantity)}
          </div>

          <button
            type="button"
            aria-label={`Quitar ${line.name}`}
            onClick={() => onRemove(line._key)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-[15px] w-[15px]" />
          </button>
        </div>
      ))}
    </div>
  );
}
