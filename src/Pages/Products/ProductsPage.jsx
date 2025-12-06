import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { products as MOCK_PRODUCTS } from "../../lib/mock";
import { currency } from "../../utils/helpers";

import ConfirmDialog from "./components/ConfirmDialog";
import ProductForm from "./components/ProductForm";
import InlineStockEditor from "./components/InlineStockEditor";



import {
  PlusCircle,
  Edit3,
  Trash2,
  Download,
  ArrowUpDown,
  Search,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";



const uid = () => Math.random().toString(36).slice(2, 9);

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (text, type = "info") => {
    const id = uid();
    setToasts((s) => [...s, { id, text, type }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 4000);
  };
  return { toasts, push };
}



export default function ProductsPage({ services }) {
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

  const { toasts, push } = useToasts();

  // fetch
  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (services && services.getProducts) {
        const res = await services.getProducts();
        setProducts(res && res.length ? res : MOCK_PRODUCTS);
      } else {
        await new Promise((r) => setTimeout(r, 300));
        setProducts(MOCK_PRODUCTS);
      }
    } catch (err) {
      console.error(err);
      push("No se pudo cargar productos — usando datos locales", "error");
      setProducts(MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
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

  // quick stock update (optimistic)
  const quickUpdateStock = async (id, newStock) => {
    const prev = products.slice();
    setProducts((ps) =>
      ps.map((p) => (p.id === id ? { ...p, stock: newStock } : p)),
    );
    try {
      if (services && services.updateProduct)
        await services.updateProduct(id, { stock: newStock });
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
    products.forEach((p) =>
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
    push("Exportando CSV...", "info");
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
      push("Permite popups para exportar PDF", "error");
      return;
    }
    w.document.write(html);
    w.document.close();
    // Wait a tick so styles apply, then print
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

  // CRUD placeholders (create/update/delete) - optimistic updates
  const handleSave = async (payload) => {
    if (payload.id) {
      const prev = products.slice();
      setProducts((ps) =>
        ps.map((p) => (p.id === payload.id ? { ...p, ...payload } : p)),
      );
      push("Producto actualizado", "success");
      try {
        if (services && services.updateProduct)
          await services.updateProduct(payload.id, payload);
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
        if (services && services.createProduct)
          await services.createProduct(newProduct);
      } catch (err) {
        console.error(err);
        setProducts((ps) => ps.filter((p) => p.id !== newProduct.id));
        push("Error creando producto", "error");
      }
    }
  };

  const handleDelete = async (id) => {
    const prev = products.slice();
    setProducts((ps) => ps.filter((p) => p.id !== id));
    push("Producto eliminado", "info");
    try {
      if (services && services.deleteProduct) await services.deleteProduct(id);
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
      if (services && services.deleteProduct) {
        for (const id of toDelete) await services.deleteProduct(id);
      }
    } catch (err) {
      console.error(err);
      setProducts(prev);
      push("Error en eliminación masiva", "error");
    }
  };

  // UI state for form / confirm
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-[1920px]">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Productos</h2>
              <p className="text-sm text-slate-500">
                Gestiona tu catálogo — acciones claras y visibles para dueños de
                tienda.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="flex items-center gap-2 rounded-md border bg-white px-2 py-1 shadow-sm">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    aria-label="Buscar productos"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Buscar por nombre, SKU o descripción"
                    className="w-56 px-2 py-1 text-sm outline-none"
                  />
                  <button
                    onClick={() => {
                      setQuery("");
                      setCategoryFilter([]);
                      setMinPrice("");
                      setMaxPrice("");
                      setStockOp("any");
                      setStockVal("");
                    }}
                    title="Limpiar filtros"
                    className="px-2 py-1"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setFiltersOpen((s) => !s)}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <Filter className="h-4 w-4" /> Filtros
              </button>

              <button
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow"
              >
                <PlusCircle className="h-4 w-4" /> Nuevo
              </button>
            </div>
          </div>

          {/* Filters panel */}
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: filtersOpen ? "auto" : 0,
            opacity: filtersOpen ? 1 : 0,
          }}
          className={`mt-4 overflow-hidden`}
        >
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm font-semibold">Filtros avanzados</div>
                <div className="text-xs text-slate-400">
                  Filtra por precio, stock y categorías
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCategoryFilter([]);
                    setMinPrice("");
                    setMaxPrice("");
                    setStockOp("any");
                    setStockVal("");
                  }}
                  className="rounded-md border px-3 py-1 text-sm"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-md border px-3 py-1 text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <div className="text-xs text-slate-500">Precio (COP)</div>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-32 rounded-md border px-2 py-1"
                  />
                  <span className="text-slate-400">—</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-32 rounded-md border px-2 py-1"
                  />
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Ej: Min 1000, Max 5000
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Stock</div>
                <div className="mt-1 flex items-center gap-2">
                  <select
                    value={stockOp}
                    onChange={(e) => setStockOp(e.target.value)}
                    className="rounded-md border px-2 py-1 text-sm"
                  >
                    <option value="any">Cualquiera</option>
                    <option value="lt">Menor que</option>
                    <option value="gt">Mayor que</option>
                    <option value="eq">Igual a</option>
                  </select>
                  <input
                    type="number"
                    value={stockVal}
                    onChange={(e) => setStockVal(e.target.value)}
                    placeholder="Valor"
                    className="w-24 rounded-md border px-2 py-1"
                  />
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Ej: menor que 10 para ver bajos stocks
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">Categorías</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  {categories.map((c) => (
                    <label key={c} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          categoryFilter.includes(c) ||
                          (c === "All" && categoryFilter.length === 0)
                        }
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
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>


          {/* Stats Dashboard */}
          <div className="mt-6 ">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-800">
                  Estadísticas del inventario
                </h4>
                <p className="text-xs text-slate-500">
                  Vista general de tu catálogo
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-blue-600"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {/* Stat 1: Total productos */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-blue-600"
                    >
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <path d="M3 6h18" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-blue-700">
                  {products.length}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600">
                  Total productos
                </div>
              </motion.div>

              {/* Stat 2: Bajo stock */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-lg bg-red-100 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-red-600"
                    >
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-red-700">
                  {products.filter((p) => p.stock <= 10).length}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600">
                  Bajo stock (≤10)
                </div>
              </motion.div>

              {/* Stat 3: Categorías */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-purple-600"
                    >
                      <path d="M4 7V4h16v3" />
                      <path d="M5 20h6" />
                      <path d="M13 4 8 20" />
                      <path d="m15 15 5 5" />
                      <path d="m20 15-5 5" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-purple-700">
                  {categories.length - 1}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600">
                  Categorías
                </div>
              </motion.div>

              {/* Stat 4: Valor total inventario */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="rounded-xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-lg bg-green-100 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-green-600"
                    >
                      <line x1="12" y1="2" x2="12" y2="22" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-green-700">
                  {currency(
                    products.reduce(
                      (acc, p) => acc + (p.price || 0) * (p.stock || 0),
                      0,
                    ),
                  ).slice(0, -3)}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600">
                  Valor inventario
                </div>
              </motion.div>

              {/* Stat 5: Stock total */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-amber-600"
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.29 7 12 12 20.71 7" />
                      <line x1="12" y1="22" x2="12" y2="12" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-amber-700">
                  {products.reduce((acc, p) => acc + (p.stock || 0), 0)}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600">
                  Unidades totales
                </div>
              </motion.div>

              {/* Stat 6: Precio promedio */}
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="rounded-lg bg-teal-100 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-teal-600"
                    >
                      <path d="M20 7h-9" />
                      <path d="M14 17H5" />
                      <circle cx="17" cy="17" r="3" />
                      <circle cx="7" cy="7" r="3" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-teal-700">
                  {products.length > 0
                    ? currency(
                      products.reduce((acc, p) => acc + (p.price || 0), 0) /
                      products.length,
                    ).slice(0, -3)
                    : "$0"}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600">
                  Precio promedio
                </div>
              </motion.div>
            </div>
          </div>


        </div>

        

        {/* Table + actions */}
        <div className="w-full">
          <div className="overflow-auto rounded-lg bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-xs uppercase text-slate-500">
                  <th className="p-3">
                    <input
                      aria-label="Seleccionar todo"
                      type="checkbox"
                      onChange={(e) =>
                        e.target.checked ? selectAllPage() : clearSelection()
                      }
                    />
                  </th>
                  <th
                    className="cursor-pointer p-3"
                    onClick={() => toggleSort("name")}
                  >
                    Producto{" "}
                    <ArrowUpDown className="ml-1 inline h-4 w-4 text-slate-400" />
                  </th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">SKU</th>
                  <th
                    className="cursor-pointer p-3"
                    onClick={() => toggleSort("price")}
                  >
                    Precio{" "}
                    <ArrowUpDown className="ml-1 inline h-4 w-4 text-slate-400" />
                  </th>
                  <th
                    className="cursor-pointer p-3"
                    onClick={() => toggleSort("stock")}
                  >
                    Stock{" "}
                    <ArrowUpDown className="ml-1 inline h-4 w-4 text-slate-400" />
                  </th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center">
                      Cargando...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-slate-500"
                    >
                      No hay productos coincidentes
                    </td>
                  </tr>
                ) : (
                  pageItems.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-slate-50">
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
                        <div className="text-xs text-slate-400">
                          {p.description}
                        </div>
                      </td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3">{p.sku}</td>
                      <td className="p-3">{currency(p.price)}</td>
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
                            className="flex items-center gap-2 rounded-md border px-3 py-1 text-sm"
                          >
                            <Edit3 className="h-4 w-4" /> Editar
                          </button>
                          <button
                            onClick={() =>
                              setConfirm({ type: "delete", payload: p })
                            }
                            className="flex items-center gap-2 rounded-md border px-3 py-1 text-sm text-red-600"
                          >
                            <Trash2 className="h-4 w-4" /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination & actions */}
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center justify-center  gap-2">
              {/* Tooltip de ayuda */}
              <div className="mt-4 flex items-center gap-2">
                <div className="group relative inline-block">
                  <button className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <path d="M12 17h.01" />
                    </svg>
                    Atajos útiles
                  </button>

                  {/* Tooltip content */}
                  <div className="invisible absolute left-0 top-full z-50 mt-2 w-80 rounded-lg border border-blue-200 bg-white p-4 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                    <div className="mb-2 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-blue-600"
                      >
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                        <path d="M5 3v4" />
                        <path d="M19 17v4" />
                        <path d="M3 5h4" />
                        <path d="M17 19h4" />
                      </svg>
                      <h4 className="text-sm font-bold text-slate-800">
                        Tips para usar esta página
                      </h4>
                    </div>

                    <ul className="space-y-3 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          1
                        </span>
                        <div>
                          <strong className="text-slate-800">+ Nuevo</strong> —
                          Agregar producto rápidamente
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          2
                        </span>
                        <div>
                          Hacer clic en el <strong className="text-slate-800">stock</strong> para editar rápido
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          3
                        </span>
                        <div>
                          Usa <strong className="text-slate-800">Filtros</strong> para ver productos por
                          precio o stock
                        </div>
                      </li>
                    </ul>

                    {/* Arrow/pointer */}
                    <div className="absolute -top-2 left-8 h-4 w-4 rotate-45 border-l border-t border-blue-200 bg-white"></div>
                  </div>
                </div>
              </div>

              <span className="flex items-center justify-center gap-2  ">
                Mostrando{" "}
                {filtered.length === 0
                  ? 0
                  : Math.min((page - 1) * perPage + 1, filtered.length)}{" "}
                - {Math.min(page * perPage, filtered.length)} de{" "}
                {filtered.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 rounded-md border px-3 py-1"
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </button>
                )}

                <div className="px-3 py-1">
                  {page} / {totalPages}
                </div>

                {page < totalPages && (
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex items-center gap-1 rounded-md border px-3 py-1"
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 rounded-md border px-3 py-1 text-sm"
                >
                  <Download className="h-4 w-4" /> CSV
                </button>
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-2 rounded-md border px-3 py-1 text-sm"
                >
                  <FileText className="h-4 w-4" /> PDF
                </button>
                <button
                  onClick={() => setConfirm({ type: "bulk-delete" })}
                  className="rounded-md border px-3 py-1 text-sm"
                  disabled={selected.size === 0}
                >
                  Eliminar ({selected.size})
                </button>

              </div>
            </div>
          </div>
        </div>



        <div className="mx-auto mt-6 max-w-6xl text-xs text-slate-400">
          Diseño pensado para dueños — acciones claras, etiquetas descriptivas,
          micro-ayudas.
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
              ? (handleDelete(confirm.payload.id), setConfirm(null))
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
              : `Eliminar ${selected.size} productos?`
          }
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-md px-4 py-2 shadow ${t.type === "error" ? "bg-red-100 text-red-800" : t.type === "success" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}`}
          >
            {t.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

ProductsPage.propTypes = {
  services: PropTypes.shape({
    getProducts: PropTypes.func,
    createProduct: PropTypes.func,
    updateProduct: PropTypes.func,
    deleteProduct: PropTypes.func,
  }),
};