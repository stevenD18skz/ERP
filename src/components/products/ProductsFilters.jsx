"use client";

// Panel de filtros avanzados. Es expandible y no un drawer, a pedido explícito:
// abrirlo no tapa la tabla, así se ve el efecto de cada filtro en el momento.
//
// El truco de grid-rows-[0fr] a [1fr] anima el alto sin tener que medirlo en
// JS; el hijo necesita overflow-hidden para que el contenido se recorte
// mientras la fila crece.
export default function ProductsFilters({
  open,
  onClose,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  stockOp,
  onStockOpChange,
  stockVal,
  onStockValChange,
  onClearAll,
}) {
  const toggleCategory = (c) => {
    if (c === "All") return onCategoryFilterChange([]);
    const next = new Set(categoryFilter);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    onCategoryFilterChange(Array.from(next));
  };

  return (
    <div
      className={`mt-4 grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="overflow-hidden">
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm font-semibold">Filtros avanzados</div>
              <div className="text-xs text-slate-400">
                Filtra por precio, stock y categorías
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClearAll}
                className="rounded-md border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
              >
                Limpiar
              </button>
              <button
                onClick={onClose}
                className="rounded-md border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 items-center justify-center gap-4 md:grid-cols-3">
            <div>
              <div className="text-xs font-medium text-slate-500">
                Precio (COP)
              </div>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => onMinPriceChange(e.target.value)}
                  placeholder="Min"
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <span className="text-slate-400">—</span>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => onMaxPriceChange(e.target.value)}
                  placeholder="Max"
                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Ej: Min 1000, Max 5000
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="text-xs font-medium text-slate-500">Stock</div>
              <div className="mt-1 flex items-center gap-2">
                <select
                  value={stockOp}
                  onChange={(e) => onStockOpChange(e.target.value)}
                  className="rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="any">Cualquiera</option>
                  <option value="lt">Menor que</option>
                  <option value="gt">Mayor que</option>
                  <option value="eq">Igual a</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={stockVal}
                  onChange={(e) => onStockValChange(e.target.value)}
                  placeholder="Valor"
                  disabled={stockOp === "any"}
                  className="w-24 rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-300"
                />
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Ej: menor que 10 para ver bajos stocks
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-500">
                Categorías
              </div>

              <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                {categories.map((c) => {
                  const checked =
                    categoryFilter.includes(c) ||
                    (c === "All" && categoryFilter.length === 0);
                  return (
                    <label
                      key={c}
                      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 ${checked ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(c)}
                      />
                      <span className="truncate">{c}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
