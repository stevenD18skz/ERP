import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

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

/*
  Products CRUD Page - Enhanced
  - Added: sorting, advanced filters (price range, stock comparisons, multi-category),
    export CSV + Print-to-PDF, improved UI with icons and clearer colors
  - UX: collapseable filter panel, column-sort by click, visual affordances for non-technical users
  - Notes: keeps fallback mock if no `services` provided. Uses window.print() for PDF export (no external deps).
*/

const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "Arroz 1Kg",
    sku: "ARZ-001",
    price: 2500,
    stock: 100,
    category: "Granos",
    description: "Arroz blanco de grano largo",
    created_at: "2025-08-01T08:00:00Z",
  },
  {
    id: "2",
    name: "Leche 1L",
    sku: "MLK-001",
    price: 1800,
    stock: 50,
    category: "Lácteos",
    description: "Leche entera 1L",
    created_at: "2025-08-02T09:00:00Z",
  },
  {
    id: "3",
    name: "Pan 500g",
    sku: "PAN-001",
    price: 1200,
    stock: 30,
    category: "Panadería",
    description: "Pan integral",
    created_at: "2025-08-03T10:00:00Z",
  },
  {
    id: "4",
    name: "Aceite 1L",
    sku: "ACE-001",
    price: 5500,
    stock: 8,
    category: "Aceites",
    description: "Aceite de girasol 1L",
    created_at: "2025-07-28T11:00:00Z",
  },
  {
    id: "5",
    name: "Azúcar 1Kg",
    sku: "AZU-001",
    price: 1200,
    stock: 150,
    category: "Dulces",
    description: "Azúcar refinada 1kg",
    created_at: "2025-07-30T12:00:00Z",
  },
  {
    id: "6",
    name: "Manzanas Kg",
    sku: "MAN-001",
    price: 800,
    stock: 6,
    category: "Frutas",
    description: "Manzanas rojas frescas",
    created_at: "2025-08-05T14:00:00Z",
  },
  {
    id: "7",
    name: "Yogur 500ml",
    sku: "YOG-001",
    price: 1500,
    stock: 40,
    category: "Lácteos",
    description: "Yogur natural 500ml",
    created_at: "2025-08-02T16:00:00Z",
  },
];

const currency = (n) =>
  typeof n === "number"
    ? n.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      })
    : "-";
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

  /* export CSV
  const exportCSV = () => {
    const rows = ["id,name,sku,category,price,stock,description,created_at"];
    products.forEach((p) => rows.push([p.id, `\"${p.name}\"`, p.sku, p.category, p.price, p.stock, `\"${(p.description || "").replace(/\"/g, "\'")}\"`, p.created_at].join(",")));
    const blob = new Blob([rows.join("
")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `productos_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
    push("CSV listo para descarga", "info");
  };*/

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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
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

        {/* Table + actions */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
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
              <div>
                Mostrando{" "}
                {filtered.length === 0
                  ? 0
                  : Math.min((page - 1) * perPage + 1, filtered.length)}{" "}
                - {Math.min(page * perPage, filtered.length)} de{" "}
                {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 rounded-md border px-3 py-1"
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </button>
                  <div className="px-3 py-1">
                    {page} / {totalPages}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="flex items-center gap-1 rounded-md border px-3 py-1"
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </button>
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

          <aside>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-700">Resumen</h4>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div>
                  Total productos:{" "}
                  <span className="font-medium">{products.length}</span>
                </div>
                <div>
                  Con bajo stock (&le;10):{" "}
                  <span className="font-medium">
                    {products.filter((p) => p.stock <= 10).length}
                  </span>
                </div>
                <div>
                  Categorías:{" "}
                  <span className="font-medium">{categories.length - 1}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-700">
                Atajos útiles
              </h4>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                <li>
                  <strong>+ Nuevo</strong> — Agregar producto rápidamente
                </li>
                <li>
                  Hacer clic en el <strong>stock</strong> para editar rápido
                </li>
                <li>
                  Usa <strong>Filtros</strong> para ver productos por precio o
                  stock
                </li>
              </ul>
            </div>
          </aside>
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

function InlineStockEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={v}
            onChange={(e) => setV(Number(e.target.value))}
            className="w-20 rounded-md border px-2 py-1 text-sm"
          />
          <button
            onClick={() => {
              setEditing(false);
              onSave(v);
            }}
            className="rounded-md border px-2 py-1 text-sm"
          >
            OK
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setV(value);
            }}
            className="rounded-md px-2 py-1 text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={`rounded-md px-2 py-1 text-sm ${value <= 5 ? "bg-red-50 text-red-700" : ""}`}
        >
          {value}
        </button>
      )}
    </div>
  );
}
InlineStockEditor.propTypes = {
  value: PropTypes.number.isRequired,
  onSave: PropTypes.func.isRequired,
};

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
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.sku)
      return setError("Nombre y SKU son obligatorios");
    if (Number(form.price) < 0 || Number(form.stock) < 0)
      return setError("Precio/Stock inválido");
    setError("");
    onSave({ ...form, price: Number(form.price), stock: Number(form.stock) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.form
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onSubmit={submit}
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {initial ? "Editar producto" : "Nuevo producto"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Nombre, SKU y precio son importantes para facturación y búsqueda.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm">
            Nombre
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="text-sm">
            SKU
            <input
              value={form.sku}
              onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="text-sm">
            Precio
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((s) => ({ ...s, price: e.target.value }))
              }
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="text-sm">
            Stock
            <input
              type="number"
              value={form.stock}
              onChange={(e) =>
                setForm((s) => ({ ...s, stock: e.target.value }))
              }
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="text-sm md:col-span-2">
            Categoría
            <input
              value={form.category}
              onChange={(e) =>
                setForm((s) => ({ ...s, category: e.target.value }))
              }
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </label>

          <label className="text-sm md:col-span-2">
            Descripción
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              rows={3}
            />
          </label>
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-white"
          >
            Guardar
          </button>
        </div>
      </motion.form>
    </div>
  );
}

ProductForm.propTypes = {
  initial: PropTypes.shape({
    name: PropTypes.string,
    sku: PropTypes.string,
    price: PropTypes.number,
    stock: PropTypes.number,
    category: PropTypes.string,
    description: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

function ConfirmDialog({
  title = "Confirmar",
  description = "¿Estás seguro?",
  onClose,
  onConfirm,
}) {
  return (
    <div className="z-60 fixed inset-0 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg"
      >
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border px-3 py-2">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-3 py-2 text-white"
          >
            Eliminar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

ConfirmDialog.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
