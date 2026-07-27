"use client";

import { Edit3, Trash2 } from "lucide-react";
import Checkbox from "@/components/ui/Checkbox";
import SortHeader from "@/components/ui/SortHeader";
import { currency } from "@/utils/converts";
import StockBadge from "./StockBadge";
import StockStepper from "./StockStepper";
import Thumb from "./Thumb";
import { getMargin, getMarginPct, isCostEstimated } from "./productsUtils";

// Tabla de escritorio. En móvil se esconde y toma su lugar ProductsCardList:
// diez columnas no caben en un teléfono ni con scroll horizontal.
export default function ProductsTable({
  items,
  selected,
  allPageSelected,
  somePageSelected,
  onToggleSelect,
  onToggleSelectAll,
  sortBy,
  sortDir,
  onSort,
  onStockCommit,
  onEdit,
  onDelete,
}) {
  return (
    <div className="mt-4 hidden overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100 md:block">
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="w-10 py-3 pl-4 pr-2">
              <Checkbox
                checked={allPageSelected}
                indeterminate={somePageSelected}
                onChange={onToggleSelectAll}
                ariaLabel="Seleccionar todos en esta página"
              />
            </th>
            <th className="w-14 px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Foto
            </th>
            <SortHeader
              label="Producto"
              sortKey="name"
              sortBy={sortBy}
              sortDir={sortDir}
              onClick={onSort}
            />
            <SortHeader
              label="Categoría"
              sortKey="category"
              sortBy={sortBy}
              sortDir={sortDir}
              onClick={onSort}
              className="w-24"
            />
            <th className="w-32 px-2 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Código de barras
            </th>
            <SortHeader
              label="Costo"
              sortKey="cost_price"
              sortBy={sortBy}
              sortDir={sortDir}
              onClick={onSort}
              align="right"
              className="w-24"
            />
            <SortHeader
              label="Precio"
              sortKey="price"
              sortBy={sortBy}
              sortDir={sortDir}
              onClick={onSort}
              align="right"
              className="w-24"
            />
            <SortHeader
              label="Margen"
              sortKey="margin"
              sortBy={sortBy}
              sortDir={sortDir}
              onClick={onSort}
              align="right"
              className="w-28"
            />
            <SortHeader
              label="Stock"
              sortKey="stock"
              sortBy={sortBy}
              sortDir={sortDir}
              onClick={onSort}
              className="w-44"
            />
            <th className="w-52 py-3 pl-2 pr-4 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr
              key={p.id}
              className={`border-b border-slate-50 transition-colors last:border-0 ${
                selected.has(p.id) ? "bg-blue-50" : "hover:bg-slate-50"
              }`}
            >
              <td className="py-2.5 pl-4 pr-2">
                <Checkbox
                  checked={selected.has(p.id)}
                  onChange={() => onToggleSelect(p.id)}
                  ariaLabel={`Seleccionar ${p.name}`}
                />
              </td>
              <td className="px-2 py-2.5">
                <Thumb photo={p.photo} />
              </td>
              <td className="px-2 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="font-bold text-slate-900">{p.name}</div>
                  <StockBadge stock={p.stock} />
                </div>
                {/* Sin SKU no se deja la línea vacía ni un "SKU —": el nombre
                    sube y la fila se ve igual de completa. */}
                {p.sku ? (
                  <div className="text-[12.5px] text-slate-400">
                    SKU {p.sku}
                  </div>
                ) : null}
              </td>
              <td className="px-2 py-2.5">
                <span className="inline-block max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 align-bottom text-[12.5px] font-semibold text-slate-700">
                  {p.category || "Sin categoría"}
                </span>
              </td>
              <td className="px-2 py-2.5 font-mono text-[12.5px] text-slate-600">
                {p.barcode || <span className="text-slate-300">—</span>}
              </td>
              <td className="px-2 py-2.5 text-right tabular-nums">
                {isCostEstimated(p) ? (
                  <span
                    className="text-slate-400"
                    title="Costo estimado: precio x 0.81. Confirmar con la factura del proveedor."
                  >
                    ~{currency(p.cost_price)}
                  </span>
                ) : (
                  <span className="text-slate-600">
                    {currency(p.cost_price)}
                  </span>
                )}
              </td>
              <td className="px-2 py-2.5 text-right font-bold tabular-nums text-slate-900">
                {currency(p.price)}
              </td>
              <td className="px-2 py-2.5 text-right">
                <div
                  className={`font-bold tabular-nums ${
                    isCostEstimated(p)
                      ? "text-slate-400"
                      : getMargin(p) >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                  }`}
                  title={
                    isCostEstimated(p)
                      ? "Sale del costo estimado, no de una factura"
                      : undefined
                  }
                >
                  {isCostEstimated(p) ? "~" : getMargin(p) >= 0 ? "+" : ""}
                  {currency(getMargin(p))}
                </div>
                <div className="text-[11.5px] text-slate-400">
                  {isCostEstimated(p) ? (
                    "estimado"
                  ) : (
                    <>
                      {getMarginPct(p) >= 0 ? "+" : ""}
                      {getMarginPct(p)}%
                    </>
                  )}
                </div>
              </td>
              <td className="px-2 py-2.5">
                <StockStepper
                  value={p.stock}
                  onCommit={(val) => onStockCommit(p.id, val)}
                />
              </td>
              <td className="py-2.5 pl-2 pr-4">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onEdit(p)}
                    aria-label={`Editar ${p.name}`}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 className="h-[15px] w-[15px]" /> Editar
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    aria-label={`Eliminar ${p.name}`}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-[13px] font-semibold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-[15px] w-[15px]" /> Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
