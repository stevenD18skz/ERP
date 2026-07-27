"use client";

import {
  DollarSign,
  Minus,
  Percent,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { currency } from "@/utils/converts";
import { lineBase, lineSubtotal } from "./salesUtils";

export function CartEmptyState() {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <ShoppingCart className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-[16px] font-bold text-slate-900">
        Aún no agregas productos
      </p>
      <p className="text-sm text-slate-500">
        Busca por nombre, SKU o código de barras.
      </p>
    </div>
  );
}

// Editor de descuento por línea. El botón que lo abre sigue desactivado (ver
// nota en CartLine), pero el editor se conserva funcionando para cuando se
// habilite.
function DiscountEditor({
  draftType,
  onDraftTypeChange,
  draftValue,
  onDraftValueChange,
  onCancel,
  onApply,
}) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2.5">
      <div className="flex overflow-hidden rounded-md border border-slate-200">
        <button
          type="button"
          aria-label="Descuento en porcentaje"
          onClick={() => onDraftTypeChange("pct")}
          className={`flex h-[34px] items-center gap-1 px-3 text-[13px] font-bold ${draftType === "pct" ? "bg-teal-600 text-white" : "bg-white text-slate-700"}`}
        >
          <Percent className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Descuento en pesos"
          onClick={() => onDraftTypeChange("amount")}
          className={`flex h-[34px] items-center gap-1 px-3 text-[13px] font-bold ${draftType === "amount" ? "bg-teal-600 text-white" : "bg-white text-slate-700"}`}
        >
          <DollarSign className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        type="number"
        min="0"
        value={draftValue}
        onChange={(e) => onDraftValueChange(e.target.value)}
        placeholder="0"
        autoFocus
        className="h-[34px] w-24 rounded-md border border-slate-200 px-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
      <button
        type="button"
        onClick={onCancel}
        className="h-[34px] rounded-md border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onApply}
        className="h-[34px] rounded-md bg-teal-600 px-3.5 text-[13px] font-bold text-white hover:bg-teal-700"
      >
        Aplicar
      </button>
    </div>
  );
}

function CartLine({ line, qtyRefs, onQtyChange, onQtyStep, onQtyKeyDown, onRemove, discount }) {
  const hasDiscount = !!line.discountType && line.discountValue > 0;

  return (
    <div className="border-b border-slate-100 p-3 last:border-0">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="min-w-[140px] flex-1">
          <div className="text-[18px] font-bold text-slate-900">
            {line.name}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">SKU {line.sku}</div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Restar"
            onClick={() => onQtyStep(line._key, -1)}
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
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
            className="no-spinner h-[30px] w-12 rounded-md border border-slate-200 text-center text-sm font-bold tabular-nums text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          <button
            type="button"
            aria-label="Sumar"
            onClick={() => onQtyStep(line._key, 1)}
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="w-[110px] shrink-0 text-right">
          <div className="text-[15px] font-bold tabular-nums text-slate-900">
            {currency(lineSubtotal(line))}
          </div>
          {hasDiscount && (
            <div className="text-xs tabular-nums text-slate-400 line-through">
              {currency(lineBase(line))}
            </div>
          )}
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

      {/* Botón para abrir/quitar el descuento por línea — desactivado
          intencionalmente, se conserva para reactivarlo cuando se decida:

      <div className="mt-2 pl-0.5">
        {hasDiscount ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
            Descuento {discountLabel}
            <button type="button" aria-label="Quitar descuento"
              onClick={() => discount.onRemove(line._key)}
              className="text-slate-500 hover:text-slate-700">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => discount.onOpen(line._key)}
            className="text-[12.5px] font-bold text-teal-700 underline hover:text-teal-800">
            Agregar descuento
          </button>
        )}
      </div>
      */}

      {discount.editingKey === line._key && (
        <DiscountEditor
          draftType={discount.draftType}
          onDraftTypeChange={discount.onDraftTypeChange}
          draftValue={discount.draftValue}
          onDraftValueChange={discount.onDraftValueChange}
          onCancel={discount.onCancel}
          onApply={discount.onApply}
        />
      )}
    </div>
  );
}

export default function CartLines({
  lines,
  qtyRefs,
  onQtyChange,
  onQtyStep,
  onQtyKeyDown,
  onRemove,
  discount,
}) {
  if (lines.length === 0) return <CartEmptyState />;

  return (
    <div className="rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-100">
      {lines.map((line) => (
        <CartLine
          key={line._key}
          line={line}
          qtyRefs={qtyRefs}
          onQtyChange={onQtyChange}
          onQtyStep={onQtyStep}
          onQtyKeyDown={onQtyKeyDown}
          onRemove={onRemove}
          discount={discount}
        />
      ))}
    </div>
  );
}
