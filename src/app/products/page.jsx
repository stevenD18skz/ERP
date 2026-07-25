"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/products.service";
import { currency } from "@/utils/converts";
import {
  PlusCircle,
  Edit3,
  Trash2,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  PackageSearch,
  Pencil,
  Check,
} from "lucide-react";

/*
  Products CRUD Page - Enhanced UX
  - Sorting con indicador direccional, filtros con chips y contador visible
  - Feedback: skeletons de carga, estados vacíos accionables, toasts con icono
    y "Deshacer" en eliminación, resaltado de fila/tarjeta seleccionada
  - Vista de tarjetas en móvil (touch-friendly) + tabla en escritorio
  - Deep-link desde el inicio: /products?new=1 abre el formulario,
    /products?stockOp=lt&stockVal=11 abre ya filtrado por stock bajo
*/

const LOW_STOCK_THRESHOLD = 10;
const uid = () => Math.random().toString(36).slice(2, 9);

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (text, type = "info", action) => {
    const id = uid();
    setToasts((s) => [...s, { id, text, type, action }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 5000);
    return id;
  };
  const dismiss = (id) => setToasts((s) => s.filter((t) => t.id !== id));
  return { toasts, push, dismiss };
}

const Chip = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-2.5 pr-1.5 text-xs font-medium text-blue-700">
    {label}
    <button
      onClick={onRemove}
      aria-label={`Quitar filtro ${label}`}
      className="rounded-full p-0.5 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // search + filters
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState([]); // multi-select
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stockOp, setStockOp] = useState("any"); // any, lt, gt, eq
  const [stockVal, setStockVal] = useState("");

  // table helpers
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const perPage = 8;

  // sorting
  const [sortBy, setSortBy] = useState(null); // 'name'|'price'|'stock'
  const [sortDir, setSortDir] = useState("asc");

  // UI toggles
  const [filtersOpen, setFiltersOpen] = useState(false);

  // form / confirm dialog state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const { toasts, push, dismiss } = useToasts();

  // fetch
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      setProducts(res || []);
    } catch (err) {
      console.error(err);
      push("No se pudo cargar productos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep-link desde el inicio: abrir filtro de stock bajo o el formulario de creación
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qOp = params.get("stockOp");
    const qVal = params.get("stockVal");
    const qNew = params.get("new");
    if (qOp && qVal) {
      setStockOp(qOp);
      setStockVal(qVal);
      setFiltersOpen(true);
    }
    if (qNew) {
      setEditing(null);
      setShowForm(true);
    }
    if (qOp || qVal || qNew) {
      router.replace("/products");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cerrar modales con Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (confirm) setConfirm(null);
      else if (showForm) {
        setShowForm(false);
        setEditing(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, showForm]);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(products.map((p) => p.category || "Otros"))),
    ],
    [products],
  );

  // filtering logic
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.slice();

    // category multi-select
    if (categoryFilter.length > 0 && !categoryFilter.includes("All")) {
      list = list.filter((p) => categoryFilter.includes(p.category));
    }

    if (q) {
      list = list.filter((p) =>
        [p.name, p.sku, p.category, p.description].some((f) =>
          (f || "").toLowerCase().includes(q),
        ),
      );
    }

    // price range
    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (!Number.isNaN(min) && minPrice !== "")
      list = list.filter((p) => p.price >= min);
    if (!Number.isNaN(max) && maxPrice !== "")
      list = list.filter((p) => p.price <= max);

    // stock comparison
    const sVal = Number(stockVal);
    if (stockOp !== "any" && !Number.isNaN(sVal)) {
      if (stockOp === "lt") list = list.filter((p) => p.stock < sVal);
      if (stockOp === "gt") list = list.filter((p) => p.stock > sVal);
      if (stockOp === "eq") list = list.filter((p) => p.stock === sVal);
    }

    // sorting
    if (sortBy) {
      list.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (typeof aVal === "string") {
          return sortDir === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      });
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [
    products,
    query,
    categoryFilter,
    minPrice,
    maxPrice,
    stockOp,
    stockVal,
    sortBy,
    sortDir,
  ]);

  const activeFilterCount =
    (categoryFilter.length > 0 ? 1 : 0) +
    (minPrice !== "" ? 1 : 0) +
    (maxPrice !== "" ? 1 : 0) +
    (stockOp !== "any" && stockVal !== "" ? 1 : 0);
  const hasActiveSearch = query.trim() !== "" || activeFilterCount > 0;

  const filterChips = useMemo(() => {
    const chips = [];
    categoryFilter.forEach((c) =>
      chips.push({
        key: `cat-${c}`,
        label: c,
        onRemove: () =>
          setCategoryFilter((prev) => prev.filter((x) => x !== c)),
      }),
    );
    if (minPrice !== "")
      chips.push({
        key: "min",
        label: `Desde ${currency(Number(minPrice))}`,
        onRemove: () => setMinPrice(""),
      });
    if (maxPrice !== "")
      chips.push({
        key: "max",
        label: `Hasta ${currency(Number(maxPrice))}`,
        onRemove: () => setMaxPrice(""),
      });
    if (stockOp !== "any" && stockVal !== "") {
      const opLabel =
        stockOp === "lt"
          ? "menor que"
          : stockOp === "gt"
            ? "mayor que"
            : "igual a";
      chips.push({
        key: "stock",
        label: `Stock ${opLabel} ${stockVal}`,
        onRemove: () => {
          setStockOp("any");
          setStockVal("");
        },
      });
    }
    return chips;
  }, [categoryFilter, minPrice, maxPrice, stockOp, stockVal]);

  const clearAllFilters = () => {
    setQuery("");
    setCategoryFilter([]);
    setMinPrice("");
    setMaxPrice("");
    setStockOp("any");
    setStockVal("");
  };

  // volver a página 1 cuando cambian los filtros (no la búsqueda de texto, que ya resetea aparte)
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, minPrice, maxPrice, stockOp, stockVal]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page],
  );

  // selection
  const toggleSelect = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const selectAllPage = () =>
    setSelected((s) => {
      const next = new Set(s);
      pageItems.forEach((p) => next.add(p.id));
      return next;
    });
  const clearSelection = () => setSelected(new Set());
  const allPageSelected =
    pageItems.length > 0 && pageItems.every((p) => selected.has(p.id));

  // quick stock update (optimistic)
  const quickUpdateStock = async (id, newStock) => {
    const prev = products.slice();
    setProducts((ps) =>
      ps.map((p) => (p.id === id ? { ...p, stock: newStock } : p)),
    );
    try {
      await updateProduct(id, { stock: newStock });
      push("Stock actualizado", "success");
    } catch (err) {
      console.error(err);
      setProducts(prev);
      push("Error actualizando stock", "error");
    }
  };

  // Export CSV
  const exportCSV = () => {
    const rows = ["id,name,sku,category,price,stock,description,created_at"];
    filtered.forEach((p) =>
      rows.push(
        [
          p.id,
          JSON.stringify(p.name),
          p.sku,
          p.category,
          p.price,
          p.stock,
          JSON.stringify(p.description || ""),
          p.created_at,
        ].join(","),
      ),
    );
    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `productos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    push(`CSV con ${filtered.length} productos descargado`, "success");
  };

  // export PDF using print (simple + reliable)
  const exportPDF = () => {
    const cols = [
      "Nombre",
      "SKU",
      "Categoría",
      "Precio",
      "Stock",
      "Descripción",
    ];
    const html = `
      <html><head><meta charset="utf-8"><title>Productos</title>
      <style>body{font-family:system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial;} table{width:100%;border-collapse:collapse;} th,td{padding:8px;border:1px solid #ddd;text-align:left;} th{background:#f7f7f7}</style>
      </head><body>
      <h2>Listado de productos — ${new Date().toLocaleString()}</h2>
      <table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
      <tbody>
      ${filtered.map((p) => `<tr><td>${p.name}</td><td>${p.sku}</td><td>${p.category}</td><td>${p.price}</td><td>${p.stock}</td><td>${p.description || ""}</td></tr>`).join("")}
      </tbody></table>
      </body></html>`;

    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      push("Permite las ventanas emergentes para exportar el PDF", "error");
      return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      w.print();
    }, 300);
    push("Preparando PDF...", "info");
  };

  // Sorting toggle helper
  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // CRUD (create/update/delete) - optimistic updates
  const handleSave = async (payload) => {
    if (payload.id) {
      const prev = products.slice();
      setProducts((ps) =>
        ps.map((p) => (p.id === payload.id ? { ...p, ...payload } : p)),
      );
      push("Producto actualizado", "success");
      try {
        await updateProduct(payload.id, payload);
      } catch (err) {
        console.error(err);
        setProducts(prev);
        push("Error actualizando producto", "error");
      }
    } else {
      const newProduct = {
        ...payload,
        id: uid(),
        created_at: new Date().toISOString(),
      };
      setProducts((ps) => [newProduct, ...ps]);
      push("Producto creado", "success");
      try {
        await createProduct(newProduct);
      } catch (err) {
        console.error(err);
        setProducts((ps) => ps.filter((p) => p.id !== newProduct.id));
        push("Error creando producto", "error");
      }
    }
  };

  const handleDelete = async (product) => {
    const prev = products.slice();
    setProducts((ps) => ps.filter((p) => p.id !== product.id));
    push(`"${product.name}" eliminado`, "info", {
      label: "Deshacer",
      onClick: async () => {
        setProducts(prev);
        try {
          await createProduct(product);
        } catch (err) {
          console.error(err);
        }
      },
    });
    try {
      await deleteProduct(product.id);
    } catch (err) {
      console.error(err);
      setProducts(prev);
      push("Error eliminando producto", "error");
    }
  };

  const handleBulkDelete = async () => {
    const toDelete = Array.from(selected);
    if (!toDelete.length) return;
    const prev = products.slice();
    setProducts((ps) => ps.filter((p) => !selected.has(p.id)));
    clearSelection();
    push(`${toDelete.length} productos eliminados`, "info");
    try {
      for (const id of toDelete) await deleteProduct(id);
    } catch (err) {
      console.error(err);
      setProducts(prev);
      push("Error en eliminación masiva", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Productos</h1>
            <p className="text-sm text-slate-500">
              Gestiona tu catálogo — acciones claras y visibles para dueños de
              tienda.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                aria-label="Buscar productos"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre, SKU o descripción"
                className="w-full py-1 text-sm outline-none sm:w-56"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                  }}
                  aria-label="Limpiar búsqueda"
                  className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFiltersOpen((s) => !s)}
                aria-expanded={filtersOpen}
                className="relative flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:flex-none"
              >
                <Filter className="h-4 w-4" /> Filtros
                {activeFilterCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:flex-none"
              >
                <PlusCircle className="h-4 w-4" /> Nuevo
              </button>
            </div>
          </div>
        </div>

        {/* Chips de filtros activos */}
        {(query.trim() || filterChips.length > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400">
              Filtros activos:
            </span>
            {query.trim() && (
              <Chip label={`"${query.trim()}"`} onRemove={() => setQuery("")} />
            )}
            {filterChips.map((c) => (
              <Chip key={c.key} label={c.label} onRemove={c.onRemove} />
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Filters panel */}
        <div
          className={`mt-4 grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            filtersOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-semibold">
                    Filtros avanzados
                  </div>
                  <div className="text-xs text-slate-400">
                    Filtra por precio, stock y categorías
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearAllFilters}
                    className="rounded-md border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="rounded-md border border-slate-200 px-3 py-1 text-sm hover:bg-slate-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    Precio (COP)
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      type="number"
                      min="0"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Ej: Min 1000, Max 5000
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-500">
                    Stock
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      value={stockOp}
                      onChange={(e) => setStockOp(e.target.value)}
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
                      onChange={(e) => setStockVal(e.target.value)}
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
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
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
                            onChange={() => {
                              if (c === "All") return setCategoryFilter([]);
                              setCategoryFilter((prev) => {
                                const next = new Set(prev);
                                if (next.has(c)) next.delete(c);
                                else next.add(c);
                                return Array.from(next);
                              });
                            }}
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

        {/* Table + actions */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            {/* Barra de selección contextual */}
            {selected.size > 0 && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white shadow-sm">
                <span className="text-sm font-medium">
                  {selected.size} producto{selected.size > 1 ? "s" : ""}{" "}
                  seleccionado{selected.size > 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearSelection}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-100 hover:bg-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setConfirm({ type: "bulk-delete" })}
                    className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </button>
                </div>
              </div>
            )}

            {/* Tabla — escritorio */}
            <div className="hidden overflow-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-100 md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr className="text-xs uppercase text-slate-500">
                    <th className="w-10 p-3">
                      <input
                        aria-label="Seleccionar todo en esta página"
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={(e) =>
                          e.target.checked ? selectAllPage() : clearSelection()
                        }
                      />
                    </th>
                    <SortHeader
                      label="Producto"
                      sortKey="name"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onClick={toggleSort}
                    />
                    <th className="p-3">Categoría</th>
                    <th className="p-3">SKU</th>
                    <SortHeader
                      label="Precio"
                      sortKey="price"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onClick={toggleSort}
                    />
                    <SortHeader
                      label="Stock"
                      sortKey="stock"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onClick={toggleSort}
                    />
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="p-3">
                          <div className="h-4 w-4 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-40 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                          <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-16 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-16 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-14 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                        </td>
                        <td className="p-3">
                          <div className="h-4 w-10 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                        </td>
                        <td className="p-3">
                          <div className="ml-auto h-6 w-24 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                        </td>
                      </tr>
                    ))
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center">
                        <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                          <PackageSearch
                            className="h-8 w-8 text-slate-300"
                            aria-hidden
                          />
                          <p className="text-sm font-medium text-slate-600">
                            No hay productos coincidentes
                          </p>
                          <p className="text-xs text-slate-400">
                            Prueba con otros términos o quita algunos
                            filtros.
                          </p>
                          {hasActiveSearch && (
                            <button
                              onClick={clearAllFilters}
                              className="mt-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              Limpiar filtros
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((p) => (
                      <tr
                        key={p.id}
                        className={`border-b border-slate-100 transition-colors ${
                          selected.has(p.id)
                            ? "bg-blue-50 hover:bg-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="p-3">
                          <input
                            aria-label={`Seleccionar ${p.name}`}
                            type="checkbox"
                            checked={selected.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                          />
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800">
                            {p.name}
                          </div>
                          <div className="max-w-xs truncate text-xs text-slate-400">
                            {p.description}
                          </div>
                        </td>
                        <td className="p-3 text-slate-600">{p.category}</td>
                        <td className="p-3 text-slate-600">{p.sku}</td>
                        <td className="p-3 font-medium tabular-nums text-slate-800">
                          {currency(p.price)}
                        </td>
                        <td className="p-3">
                          <InlineStockEditor
                            value={p.stock}
                            onSave={(val) => quickUpdateStock(p.id, val)}
                          />
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditing(p);
                                setShowForm(true);
                              }}
                              aria-label={`Editar ${p.name}`}
                              className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Editar
                            </button>
                            <button
                              onClick={() =>
                                setConfirm({ type: "delete", payload: p })
                              }
                              aria-label={`Eliminar ${p.name}`}
                              className="flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Tarjetas — móvil */}
            <div className="space-y-3 md:hidden">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100"
                  >
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                    <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                  </div>
                ))
              ) : pageItems.length === 0 ? (
                <div className="rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
                  <PackageSearch
                    className="mx-auto h-8 w-8 text-slate-300"
                    aria-hidden
                  />
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    No hay productos coincidentes
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Prueba con otros términos o quita algunos filtros.
                  </p>
                  {hasActiveSearch && (
                    <button
                      onClick={clearAllFilters}
                      className="mt-3 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                pageItems.map((p) => (
                  <div
                    key={p.id}
                    className={`rounded-lg bg-white p-3 shadow-sm ring-1 transition-colors ${
                      selected.has(p.id)
                        ? "bg-blue-50 ring-2 ring-blue-300"
                        : "ring-slate-100"
                    }`}
                  >
                    <div className="flex items-start gap-1">
                      <label className="flex h-11 w-9 shrink-0 items-center justify-center">
                        <input
                          aria-label={`Seleccionar ${p.name}`}
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="h-5 w-5"
                        />
                      </label>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-medium text-slate-800">
                              {p.name}
                            </div>
                            <div className="truncate text-xs text-slate-400">
                              {p.sku} · {p.category}
                            </div>
                          </div>
                          <div className="shrink-0 font-semibold tabular-nums text-slate-800">
                            {currency(p.price)}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            Stock:
                            <InlineStockEditor
                              value={p.stock}
                              onSave={(val) => quickUpdateStock(p.id, val)}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditing(p);
                                setShowForm(true);
                              }}
                              aria-label={`Editar ${p.name}`}
                              className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirm({ type: "delete", payload: p })
                              }
                              aria-label={`Eliminar ${p.name}`}
                              className="flex h-11 w-11 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination & export */}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                Mostrando{" "}
                {filtered.length === 0
                  ? 0
                  : Math.min((page - 1) * perPage + 1, filtered.length)}{" "}
                - {Math.min(page * perPage, filtered.length)} de{" "}
                {filtered.length}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </button>
                  <div className="px-2 py-1 text-sm text-slate-600 tabular-nums">
                    {page} / {totalPages}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={exportCSV}
                    disabled={filtered.length === 0}
                    className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" /> CSV
                  </button>
                  <button
                    onClick={exportPDF}
                    disabled={filtered.length === 0}
                    className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <FileText className="h-4 w-4" /> PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <h4 className="text-sm font-semibold text-slate-700">
                Resumen
              </h4>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Total productos</span>
                  <span className="font-medium tabular-nums">
                    {products.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Con bajo stock (&le;{LOW_STOCK_THRESHOLD})</span>
                  <span
                    className={`font-medium tabular-nums ${
                      products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
                        .length > 0
                        ? "text-amber-600"
                        : ""
                    }`}
                  >
                    {
                      products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
                        .length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Categorías</span>
                  <span className="font-medium tabular-nums">
                    {categories.length - 1}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <h4 className="text-sm font-semibold text-slate-700">
                Atajos útiles
              </h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                <li>
                  <strong>+ Nuevo</strong> — Agregar producto rápidamente
                </li>
                <li>
                  Toca el <strong>stock</strong> para editarlo al instante
                </li>
                <li>
                  Ordena la tabla tocando el encabezado de una columna
                </li>
                <li>
                  Si eliminas algo por error, usa <strong>Deshacer</strong> en
                  el aviso
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Modals & dialogs */}
      {showForm && (
        <ProductForm
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={(p) => {
            handleSave(p);
            setShowForm(false);
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          onClose={() => setConfirm(null)}
          onConfirm={() =>
            confirm.type === "delete"
              ? (handleDelete(confirm.payload), setConfirm(null))
              : (handleBulkDelete(), setConfirm(null))
          }
          title={
            confirm.type === "delete"
              ? "Eliminar producto"
              : "Eliminar productos seleccionados"
          }
          description={
            confirm.type === "delete"
              ? `¿Eliminar ${confirm.payload.name}? Esta acción no se puede deshacer.`
              : `¿Eliminar ${selected.size} productos? Esta acción no se puede deshacer.`
          }
        />
      )}

      {/* Toasts */}
      <div
        aria-live="polite"
        role="status"
        className="fixed bottom-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => {
          const Icon =
            t.type === "error"
              ? XCircle
              : t.type === "success"
                ? CheckCircle2
                : Info;
          const styles =
            t.type === "error"
              ? "bg-red-50 text-red-800 ring-red-100"
              : t.type === "success"
                ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
                : "bg-slate-100 text-slate-800 ring-slate-200";
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg ring-1 animate-fade-slide-up ${styles}`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1 text-sm">{t.text}</span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action.onClick();
                    dismiss(t.id);
                  }}
                  className="shrink-0 text-sm font-semibold underline underline-offset-2"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar notificación"
                className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SortHeader({ label, sortKey, sortBy, sortDir, onClick }) {
  const active = sortBy === sortKey;
  const Icon = !active ? ChevronsUpDown : sortDir === "asc" ? ChevronUp : ChevronDown;
  return (
    <th
      className={`cursor-pointer select-none p-3 transition-colors hover:bg-slate-50 ${active ? "text-blue-600" : ""}`}
      onClick={() => onClick(sortKey)}
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon
          className={`h-3.5 w-3.5 ${active ? "text-blue-600" : "text-slate-400"}`}
        />
      </span>
    </th>
  );
}

function InlineStockEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);

  const commit = () => {
    setEditing(false);
    if (Number(v) !== value) onSave(Number(v));
  };
  const cancel = () => {
    setEditing(false);
    setV(value);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          autoFocus
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          onBlur={commit}
          className="w-20 rounded-md border border-blue-300 px-2 py-1 text-sm outline-none ring-2 ring-blue-100"
        />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={commit}
          aria-label="Guardar stock"
          className="rounded-md bg-blue-600 p-1.5 text-white hover:bg-blue-700"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          aria-label="Cancelar edición de stock"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      aria-label={`Editar stock, actualmente ${value} unidades`}
      className={`group inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm hover:border-slate-200 hover:bg-slate-50 ${
        value <= LOW_STOCK_THRESHOLD
          ? "font-semibold text-amber-700"
          : "text-slate-700"
      }`}
    >
      {value}
      <Pencil
        className="h-3 w-3 text-slate-300 group-hover:text-slate-500"
        aria-hidden
      />
    </button>
  );
}

function ProductForm({ initial = null, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: "",
    sku: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    ...initial,
  }));
  const [errors, setErrors] = useState({});

  const setField = (key) => (e) => {
    const val = e.target.value;
    setForm((s) => ({ ...s, [key]: val }));
    setErrors((er) => (er[key] ? { ...er, [key]: undefined } : er));
  };

  const submit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!String(form.name).trim())
      nextErrors.name = "El nombre es obligatorio";
    if (!String(form.sku).trim()) nextErrors.sku = "El SKU es obligatorio";
    if (form.price === "" || Number(form.price) < 0)
      nextErrors.price = "Ingresa un precio válido";
    if (form.stock === "" || Number(form.stock) < 0)
      nextErrors.stock = "Ingresa una cantidad de stock válida";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    onSave({ ...form, price: Number(form.price), stock: Number(form.stock) });
  };

  const fieldClass = (key) =>
    `mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${
      errors[key]
        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
        : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        noValidate
        className="w-full max-w-lg animate-scale-in rounded-xl bg-white p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {initial ? "Editar producto" : "Nuevo producto"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Nombre, SKU y precio son importantes para facturación y búsqueda.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="font-medium text-slate-700">
              Nombre <span className="text-red-500">*</span>
            </span>
            <input
              autoFocus
              value={form.name}
              onChange={setField("name")}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "error-name" : undefined}
              className={fieldClass("name")}
            />
            {errors.name && (
              <p id="error-name" className="mt-1 text-xs text-red-600">
                {errors.name}
              </p>
            )}
          </label>

          <label className="text-sm">
            <span className="font-medium text-slate-700">
              SKU <span className="text-red-500">*</span>
            </span>
            <input
              value={form.sku}
              onChange={setField("sku")}
              aria-invalid={!!errors.sku}
              aria-describedby={errors.sku ? "error-sku" : undefined}
              className={fieldClass("sku")}
            />
            {errors.sku && (
              <p id="error-sku" className="mt-1 text-xs text-red-600">
                {errors.sku}
              </p>
            )}
          </label>

          <label className="text-sm">
            <span className="font-medium text-slate-700">
              Precio <span className="text-red-500">*</span>
            </span>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={setField("price")}
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? "error-price" : undefined}
              className={fieldClass("price")}
            />
            {errors.price && (
              <p id="error-price" className="mt-1 text-xs text-red-600">
                {errors.price}
              </p>
            )}
          </label>

          <label className="text-sm">
            <span className="font-medium text-slate-700">
              Stock <span className="text-red-500">*</span>
            </span>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={setField("stock")}
              aria-invalid={!!errors.stock}
              aria-describedby={errors.stock ? "error-stock" : undefined}
              className={fieldClass("stock")}
            />
            {errors.stock && (
              <p id="error-stock" className="mt-1 text-xs text-red-600">
                {errors.stock}
              </p>
            )}
          </label>

          <label className="text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Categoría</span>
            <input
              value={form.category}
              onChange={setField("category")}
              className={fieldClass("category")}
            />
          </label>

          <label className="text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Descripción</span>
            <textarea
              value={form.description}
              onChange={setField("description")}
              className={fieldClass("description")}
              rows={3}
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDialog({
  title = "Confirmar",
  description = "¿Estás seguro?",
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
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
