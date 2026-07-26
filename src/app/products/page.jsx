"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Upload,
  UploadCloud,
  RefreshCw,
  Printer,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  PackageSearch,
  ImagePlus,
  Minus,
  Plus,
  Check,
  Loader2,
  DollarSign,
} from "lucide-react";

/*
  Products CRUD Page
  - Layout/estilo portado del prototipo de Claude Design (tarjetas blancas,
    fila de acciones arriba, columna de Margen, foto de producto, stepper de
    stock siempre visible, importar CSV real, checkboxes cuadrados).
  - Se conserva el panel de filtros propio (expandible, no drawer) y la barra
    de paginación propia ("Mostrando X-Y de Z / Anterior / pág. / Siguiente")
    a pedido explícito — el resto sigue el diseño nuevo.
  - Deep-link desde el inicio: /products?new=1 abre el formulario,
    /products?stockOp=lt&stockVal=11 abre ya filtrado por stock bajo
*/

const LOW_STOCK_THRESHOLD = 10;
const uid = () => Math.random().toString(36).slice(2, 9);
const CSV_TEMPLATE_HEADERS = [
  "name",
  "sku",
  "barcode",
  "category",
  "cost_price",
  "price",
  "stock",
  "description",
];

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

const getMargin = (p) => (Number(p.price) || 0) - (Number(p.cost_price) || 0);
const getMarginPct = (p) =>
  p.cost_price ? Math.round((getMargin(p) / p.cost_price) * 100) : 0;

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

const Checkbox = ({ checked, indeterminate = false, onChange, ariaLabel }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={indeterminate ? "mixed" : checked}
    aria-label={ariaLabel}
    onClick={onChange}
    className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px] border-slate-300 bg-white hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
  >
    {checked && <Check className="h-3.5 w-3.5 text-blue-600" strokeWidth={3} />}
    {indeterminate && !checked && (
      <Minus className="h-3.5 w-3.5 text-blue-600" strokeWidth={3} />
    )}
  </button>
);

function StockStepper({ value, onCommit }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commitDraft = () => {
    const v = parseInt(draft, 10);
    if (!Number.isNaN(v) && v >= 0 && v !== value) onCommit(v);
    else setDraft(String(value));
  };
  const step = (delta) => onCommit(Math.max(0, value + delta));

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Restar una unidad"
        onClick={() => step(-1)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        min="0"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        aria-label="Cantidad en stock"
        className="no-spinner w-14 rounded-md border border-slate-200 py-1 text-center text-sm font-semibold tabular-nums text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      <button
        type="button"
        aria-label="Sumar una unidad"
        onClick={() => step(1)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const StockBadge = ({ stock }) =>
  stock <= LOW_STOCK_THRESHOLD ? (
    <span className=" inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
      <AlertTriangle className="h-2.5 w-2.5" />
      {stock === 0 ? "Agotado" : "Stock bajo"}
    </span>
  ) : null;

const Thumb = ({ photo, size = "h-11 w-11" }) => (
  <div
    className={`${size} shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50`}
  >
    {photo ? (
      <img src={photo} alt="" className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-slate-300">
        <ImagePlus className="h-4 w-4" />
      </div>
    )}
  </div>
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
  const [sortBy, setSortBy] = useState(null); // 'name'|'category'|'price'|'cost_price'|'margin'|'stock'
  const [sortDir, setSortDir] = useState("asc");

  // UI toggles
  const [filtersOpen, setFiltersOpen] = useState(false);

  // form / confirm dialog state
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  // import modal state
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importParsed, setImportParsed] = useState({ valid: [], errors: [] });
  const [importSaving, setImportSaving] = useState(false);

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
      else if (importOpen) setImportOpen(false);
      else if (showForm) {
        setShowForm(false);
        setEditing(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, showForm, importOpen]);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(products.map((p) => p.category || "Otros"))),
    ],
    [products],
  );

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length,
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
        [p.name, p.sku, p.barcode, p.category, p.description].some((f) =>
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
        const aVal = sortBy === "margin" ? getMargin(a) : a[sortBy];
        const bVal = sortBy === "margin" ? getMargin(b) : b[sortBy];
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
  const somePageSelected =
    pageItems.some((p) => selected.has(p.id)) && !allPageSelected;

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
    const rows = [
      "id,name,sku,barcode,category,cost_price,price,stock,description,created_at",
    ];
    filtered.forEach((p) =>
      rows.push(
        [
          p.id,
          JSON.stringify(p.name),
          p.sku,
          p.barcode || "",
          p.category,
          p.cost_price,
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
      "Costo",
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
      ${filtered.map((p) => `<tr><td>${p.name}</td><td>${p.sku}</td><td>${p.category}</td><td>${p.cost_price}</td><td>${p.price}</td><td>${p.stock}</td><td>${p.description || ""}</td></tr>`).join("")}
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

  const downloadTemplate = () => {
    const rows = [
      CSV_TEMPLATE_HEADERS.join(","),
      [
        "Arroz 1Kg",
        "ARZ-001",
        "",
        "Granos",
        1800,
        2500,
        100,
        "Arroz blanco de grano largo",
      ].join(","),
    ];
    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_productos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sorting toggle helper
  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // CRUD (create/update/delete) - optimistic updates, awaited para feedback real de guardado
  const handleSave = async (payload) => {
    if (payload.id) {
      const prev = products.slice();
      setProducts((ps) =>
        ps.map((p) => (p.id === payload.id ? { ...p, ...payload } : p)),
      );
      try {
        await updateProduct(payload.id, payload);
        push("Producto actualizado", "success");
      } catch (err) {
        console.error(err);
        setProducts(prev);
        push("Error actualizando producto", "error");
        throw err;
      }
    } else {
      const newProduct = {
        ...payload,
        id: uid(),
        created_at: new Date().toISOString(),
      };
      setProducts((ps) => [newProduct, ...ps]);
      try {
        await createProduct(newProduct);
        push("Producto creado", "success");
      } catch (err) {
        console.error(err);
        setProducts((ps) => ps.filter((p) => p.id !== newProduct.id));
        push("Error creando producto", "error");
        throw err;
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

  // --- Importar CSV ---
  const parseCSV = (text) => {
    const rows = [];
    let cur = "";
    let row = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            cur += '"';
            i++;
          } else inQuotes = false;
        } else cur += c;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(cur);
        cur = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur);
        cur = "";
        if (row.some((f) => f.trim() !== "")) rows.push(row);
        row = [];
      } else {
        cur += c;
      }
    }
    if (cur !== "" || row.length) {
      row.push(cur);
      rows.push(row);
    }
    return rows;
  };

  const validateImportRow = (obj) => {
    if (!obj.name?.trim()) return "Falta el nombre";
    if (!obj.sku?.trim()) return "Falta el SKU";
    if (
      obj.price === undefined ||
      obj.price === "" ||
      Number.isNaN(Number(obj.price)) ||
      Number(obj.price) < 0
    )
      return "Precio inválido";
    if (
      obj.cost_price === undefined ||
      obj.cost_price === "" ||
      Number.isNaN(Number(obj.cost_price)) ||
      Number(obj.cost_price) < 0
    )
      return "Costo inválido";
    if (
      obj.stock === undefined ||
      obj.stock === "" ||
      Number.isNaN(Number(obj.stock)) ||
      Number(obj.stock) < 0
    )
      return "Stock inválido";
    return null;
  };

  const handleImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const rows = parseCSV(text);
      if (!rows.length) {
        push("El archivo está vacío", "error");
        return;
      }
      const headers = rows[0].map((h) => h.trim().toLowerCase());
      const dataRows = rows.slice(1);
      const valid = [];
      const errors = [];
      dataRows.forEach((r, idx) => {
        const obj = {};
        headers.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
        const reason = validateImportRow(obj);
        if (reason) {
          errors.push({ row: idx + 2, reason });
        } else {
          valid.push({
            name: obj.name,
            sku: obj.sku,
            barcode: obj.barcode || "",
            category: obj.category || "",
            cost_price: Number(obj.cost_price),
            price: Number(obj.price),
            stock: Number(obj.stock),
            description: obj.description || "",
          });
        }
      });
      setImportParsed({ valid, errors });
      setImportStep(2);
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    setImportSaving(true);
    const created = [];
    for (const row of importParsed.valid) {
      const newProduct = {
        ...row,
        id: uid(),
        created_at: new Date().toISOString(),
      };
      try {
        await createProduct(newProduct);
        created.push(newProduct);
      } catch (err) {
        console.error(err);
      }
    }
    setProducts((ps) => [...created, ...ps]);
    setImportSaving(false);
    setImportStep(3);
  };

  const closeImport = () => {
    setImportOpen(false);
    setImportStep(1);
    setImportParsed({ valid: [], errors: [] });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600">
              {products.length} producto{products.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Actualizar
            </button>
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Upload className="h-4 w-4" />
              Importar
            </button>
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <button
              onClick={exportPDF}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <PlusCircle className="h-4 w-4" />
              Nuevo producto
            </button>
          </div>
        </div>

        {/* Alerta de stock bajo 
        {!loading && lowStockCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setStockOp("lt");
              setStockVal(String(LOW_STOCK_THRESHOLD + 1));
            }}
            className="mt-4 flex w-full items-center gap-3.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left shadow-sm transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-amber-900">
                {lowStockCount} producto{lowStockCount > 1 ? "s" : ""} con
                stock bajo
              </p>
              <p className="text-xs text-amber-700">Toca para ver la lista</p>
            </div>
            <ChevronRight className="h-[18px] w-[18px] shrink-0 text-amber-600" />
          </button>
        )}*/}

        {/* Toolbar: búsqueda + filtros + chips */}
        <div className="mt-4 rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-wrap gap-2.5">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Buscar productos"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre, SKU o código de barras"
                className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-9 text-[15px] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                  }}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setFiltersOpen((s) => !s)}
              aria-expanded={filtersOpen}
              className="relative flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {(query.trim() || filterChips.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="text-xs font-medium text-slate-400">
                Filtros activos:
              </span>
              {query.trim() && (
                <Chip
                  label={`"${query.trim()}"`}
                  onRemove={() => setQuery("")}
                />
              )}
              {filterChips.map((c) => (
                <Chip key={c.key} label={c.label} onRemove={c.onRemove} />
              ))}
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-slate-500 underline hover:text-slate-700"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>

        {/* Filters panel (propio: expandible, no drawer) */}
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

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 items-center justify-center">
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

                <div className="flex flex-col items-center justify-center">
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

        {/* Barra de selección contextual */}
        {selected.size > 0 && (
          <div className="sticky top-16 z-20 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-blue-700 px-4 py-3 text-white shadow-lg">
            <span className="text-sm font-bold">
              {selected.size} seleccionado{selected.size > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                onClick={clearSelection}
                className="rounded-lg bg-white/15 px-3.5 py-2 text-sm font-semibold text-white hover:bg-white/25"
              >
                Cancelar
              </button>
              <button
                onClick={() => setConfirm({ type: "bulk-delete" })}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" /> Eliminar seleccionados
              </button>
            </div>
          </div>
        )}

        {/* Tabla — escritorio */}
        {!loading && pageItems.length > 0 && (
          <div className="mt-4 hidden overflow-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100 md:block">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-10 py-3 pl-4 pr-2">
                    <Checkbox
                      checked={allPageSelected}
                      indeterminate={somePageSelected}
                      onChange={() =>
                        allPageSelected ? clearSelection() : selectAllPage()
                      }
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
                    onClick={toggleSort}
                  />
                  <SortHeader
                    label="Categoría"
                    sortKey="category"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onClick={toggleSort}
                    className="w-24"
                  />
                  <SortHeader
                    label="Costo"
                    sortKey="cost_price"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onClick={toggleSort}
                    align="right"
                    className="w-24"
                  />
                  <SortHeader
                    label="Precio"
                    sortKey="price"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onClick={toggleSort}
                    align="right"
                    className="w-24"
                  />
                  <SortHeader
                    label="Margen"
                    sortKey="margin"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onClick={toggleSort}
                    align="right"
                    className="w-28"
                  />
                  <SortHeader
                    label="Stock"
                    sortKey="stock"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onClick={toggleSort}
                    className="w-44"
                  />
                  <th className="w-52 py-3 pl-2 pr-4 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-slate-50 transition-colors last:border-0 ${
                      selected.has(p.id) ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-2.5 pl-4 pr-2">
                      <Checkbox
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        ariaLabel={`Seleccionar ${p.name}`}
                      />
                    </td>
                    <td className="px-2 py-2.5">
                      <Thumb photo={p.photo} />
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900">
                          {p.name}
                        </div>
                        <StockBadge stock={p.stock} />
                      </div>
                      <div className="text-[12.5px] text-slate-400">
                        SKU {p.sku}
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="inline-block max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-[12.5px] font-semibold text-slate-700 align-bottom">
                        {p.category || "Sin categoría"}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums text-slate-600">
                      {currency(p.cost_price)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-bold tabular-nums text-slate-900">
                      {currency(p.price)}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <div
                        className={`font-bold tabular-nums ${getMargin(p) >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {getMargin(p) >= 0 ? "+" : ""}
                        {currency(getMargin(p))}
                      </div>
                      <div className="text-[11.5px] text-slate-400">
                        {getMarginPct(p) >= 0 ? "+" : ""}
                        {getMarginPct(p)}%
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <StockStepper
                        value={p.stock}
                        onCommit={(val) => quickUpdateStock(p.id, val)}
                      />
                    </td>
                    <td className="py-2.5 pl-2 pr-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setEditing(p);
                            setShowForm(true);
                          }}
                          aria-label={`Editar ${p.name}`}
                          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Edit3 className="h-[15px] w-[15px]" /> Editar
                        </button>
                        <button
                          onClick={() =>
                            setConfirm({ type: "delete", payload: p })
                          }
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
        )}

        {/* Tarjetas — móvil */}
        {!loading && pageItems.length > 0 && (
          <div className="mt-4 space-y-3 md:hidden">
            {pageItems.map((p) => (
              <div
                key={p.id}
                className={`rounded-2xl bg-white p-3.5 shadow-sm ring-1 transition-colors ${
                  selected.has(p.id)
                    ? "bg-blue-50 ring-2 ring-blue-300"
                    : "ring-slate-100"
                }`}
              >
                <div className="flex gap-3">
                  <div className="pt-1">
                    <Checkbox
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      ariaLabel={`Seleccionar ${p.name}`}
                    />
                  </div>
                  <Thumb photo={p.photo} size="h-14 w-14" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[16px] font-bold text-slate-900">
                      {p.name}
                    </div>
                    <div className="truncate text-[12.5px] text-slate-400">
                      SKU {p.sku}
                    </div>
                    <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {p.category || "Sin categoría"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5">
                  <div>
                    <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
                      Costo
                    </div>
                    <div className="mt-0.5 text-[14px] font-semibold tabular-nums text-slate-700">
                      {currency(p.cost_price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
                      Precio
                    </div>
                    <div className="mt-0.5 text-[14px] font-bold tabular-nums text-slate-900">
                      {currency(p.price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">
                      Margen
                    </div>
                    <div
                      className={`mt-0.5 text-[14px] font-bold tabular-nums ${getMargin(p) >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {getMargin(p) >= 0 ? "+" : ""}
                      {currency(getMargin(p))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-3">
                  <div>
                    <StockStepper
                      value={p.stock}
                      onCommit={(val) => quickUpdateStock(p.id, val)}
                    />
                    <StockBadge stock={p.stock} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setShowForm(true);
                      }}
                      aria-label={`Editar ${p.name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        setConfirm({ type: "delete", payload: p })
                      }
                      aria-label={`Eliminar ${p.name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3.5 py-1.5">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/5 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                  <div className="h-2.5 w-1/5 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
                </div>
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && pageItems.length === 0 && (
          <div className="mt-4 flex flex-col items-center gap-3.5 rounded-xl bg-white p-16 text-center shadow-sm ring-1 ring-slate-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <PackageSearch className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-900">
              No encontramos productos
            </p>
            <p className="max-w-sm text-sm text-slate-500">
              Prueba con otra palabra de búsqueda o quita algunos filtros para
              ver más resultados.
            </p>
            {hasActiveSearch && (
              <button
                onClick={clearAllFilters}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Paginación (propia, se conserva el formato existente) */}
        {!loading && filtered.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              Mostrando{" "}
              {filtered.length === 0
                ? 0
                : Math.min((page - 1) * perPage + 1, filtered.length)}{" "}
              - {Math.min(page * perPage, filtered.length)} de{" "}
              {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Anterior
              </button>
              <div className="px-2 py-1 text-sm tabular-nums text-slate-600">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & dialogs */}
      {showForm && (
        <ProductForm
          initial={editing}
          existingCategories={categories.filter((c) => c !== "All")}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={async (p) => {
            await handleSave(p);
            setShowForm(false);
            setEditing(null);
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

      {importOpen && (
        <ImportModal
          step={importStep}
          parsed={importParsed}
          saving={importSaving}
          onClose={closeImport}
          onFile={handleImportFile}
          onDownloadTemplate={downloadTemplate}
          onConfirm={confirmImport}
          onFinish={() => {
            closeImport();
            push(`${importParsed.valid.length} productos importados`, "success");
          }}
        />
      )}

      {/* Toasts */}
      <div
        aria-live="polite"
        role="status"
        className="fixed inset-x-0 bottom-6 z-[70] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => {
          const Icon =
            t.type === "error"
              ? XCircle
              : t.type === "success"
                ? CheckCircle2
                : Info;
          const iconColor =
            t.type === "error"
              ? "text-red-400"
              : t.type === "success"
                ? "text-emerald-400"
                : "text-blue-300";
          return (
            <div
              key={t.id}
              className="flex w-full max-w-md animate-fade-slide-up items-center gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-white shadow-xl"
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 ${iconColor}`} />
              <span className="flex-1 text-sm font-medium">{t.text}</span>
              {t.action && (
                <button
                  onClick={() => {
                    t.action.onClick();
                    dismiss(t.id);
                  }}
                  className="shrink-0 text-sm font-bold text-blue-300 hover:text-blue-200"
                >
                  {t.action.label}
                </button>
              )}
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar notificación"
                className="shrink-0 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  sortBy,
  sortDir,
  onClick,
  align = "left",
  className = "",
}) {
  const active = sortBy === sortKey;
  const Icon = !active
    ? ChevronsUpDown
    : sortDir === "asc"
      ? ChevronUp
      : ChevronDown;
  return (
    <th
      className={`cursor-pointer select-none px-2 py-3 text-${align} transition-colors hover:bg-slate-50 ${active ? "text-blue-600" : "text-slate-500"} ${className}`}
      onClick={() => onClick(sortKey)}
      aria-sort={
        active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        <Icon
          className={`h-3.5 w-3.5 ${active ? "text-blue-600" : "text-slate-400"}`}
        />
      </span>
    </th>
  );
}

function ProductForm({ initial = null, existingCategories = [], onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: "",
    sku: "",
    barcode: "",
    price: "",
    cost_price: "",
    stock: "",
    category: "",
    description: "",
    ...initial,
  }));
  const [photo, setPhoto] = useState(initial?.photo || null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const setField = (key) => (e) => {
    const val = e.target.value;
    setForm((s) => ({ ...s, [key]: val }));
    setErrors((er) => (er[key] ? { ...er, [key]: undefined } : er));
  };

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const costNum = Number(form.cost_price);
  const priceNum = Number(form.price);
  const hasMarginPreview =
    form.cost_price !== "" &&
    form.price !== "" &&
    !Number.isNaN(costNum) &&
    !Number.isNaN(priceNum);
  const marginPreview = priceNum - costNum;
  const marginPreviewPct = costNum > 0 ? Math.round((marginPreview / costNum) * 100) : 0;

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!String(form.name).trim())
      nextErrors.name = "El nombre es obligatorio";
    if (!String(form.sku).trim()) nextErrors.sku = "El SKU es obligatorio";
    if (form.price === "" || Number(form.price) < 0)
      nextErrors.price = "Ingresa un precio válido";
    if (form.cost_price === "" || Number(form.cost_price) < 0)
      nextErrors.cost_price = "Ingresa un costo válido";
    if (form.stock === "" || Number(form.stock) < 0)
      nextErrors.stock = "Ingresa una cantidad de stock válida";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSave({
        ...form,
        photo,
        price: Number(form.price),
        cost_price: Number(form.cost_price),
        stock: Number(form.stock),
      });
    } catch {
      // el toast de error ya lo muestra el padre; se deja el formulario abierto
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (key) =>
    `mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 ${
      errors[key]
        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
        : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-8"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        noValidate
        className="w-full max-w-lg animate-scale-in rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-extrabold text-slate-900">
            {initial ? "Editar producto" : "Nuevo producto"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-700"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Foto */}
          <div className="flex items-start gap-4">
            <div className="relative h-24 w-24 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100"
              >
                {photo ? (
                  <img src={photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-slate-400">
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[10px] font-semibold">Foto</span>
                  </span>
                )}
              </button>
              {photo && (
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  aria-label="Quitar foto"
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-500 shadow ring-1 ring-slate-200 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onPhotoChange}
              className="hidden"
            />
            <p className="pt-1.5 text-xs text-slate-500">
              Toca el recuadro para subir una foto. Ayuda a reconocer el
              producto rápido en la lista y en Ventas.
            </p>
          </div>

          <label className="text-sm">
            <span className="font-semibold text-slate-700">
              Nombre <span className="text-red-500">*</span>
            </span>
            <input
              autoFocus
              value={form.name}
              onChange={setField("name")}
              placeholder="Ej. Leche entera 1L"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "error-name" : undefined}
              className={fieldClass("name")}
            />
            {errors.name && (
              <p id="error-name" className="mt-1 text-xs font-semibold text-red-600">
                {errors.name}
              </p>
            )}
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="font-semibold text-slate-700">
                SKU <span className="text-red-500">*</span>
              </span>
              <input
                value={form.sku}
                onChange={setField("sku")}
                placeholder="Ej. LAC-0012"
                aria-invalid={!!errors.sku}
                aria-describedby={errors.sku ? "error-sku" : undefined}
                className={fieldClass("sku")}
              />
              {errors.sku && (
                <p id="error-sku" className="mt-1 text-xs font-semibold text-red-600">
                  {errors.sku}
                </p>
              )}
            </label>

            <label className="text-sm">
              <span className="font-semibold text-slate-700">
                Código de barras
              </span>
              <input
                value={form.barcode}
                onChange={setField("barcode")}
                placeholder="Opcional"
                className={fieldClass("barcode")}
              />
            </label>
          </div>

          <label className="text-sm">
            <span className="font-semibold text-slate-700">Categoría</span>
            <input
              list="category-options"
              value={form.category}
              onChange={setField("category")}
              placeholder="Ej. Granos"
              className={fieldClass("category")}
            />
            <datalist id="category-options">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="font-semibold text-slate-700">
                Costo <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                min="0"
                value={form.cost_price}
                onChange={setField("cost_price")}
                placeholder="0"
                aria-invalid={!!errors.cost_price}
                aria-describedby={errors.cost_price ? "error-cost_price" : undefined}
                className={fieldClass("cost_price")}
              />
              {errors.cost_price && (
                <p id="error-cost_price" className="mt-1 text-xs font-semibold text-red-600">
                  {errors.cost_price}
                </p>
              )}
            </label>

            <label className="text-sm">
              <span className="font-semibold text-slate-700">
                Precio de venta <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={setField("price")}
                placeholder="0"
                aria-invalid={!!errors.price}
                aria-describedby={errors.price ? "error-price" : undefined}
                className={fieldClass("price")}
              />
              {errors.price && (
                <p id="error-price" className="mt-1 text-xs font-semibold text-red-600">
                  {errors.price}
                </p>
              )}
            </label>
          </div>

          {hasMarginPreview && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-[13.5px] font-semibold text-emerald-800">
              <DollarSign className="h-4 w-4" />
              Ganancia por unidad: {marginPreview >= 0 ? "+" : ""}
              {currency(marginPreview)} ({marginPreviewPct >= 0 ? "+" : ""}
              {marginPreviewPct}%)
            </div>
          )}

          <label className="text-sm">
            <span className="font-semibold text-slate-700">
              Stock inicial <span className="text-red-500">*</span>
            </span>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={setField("stock")}
              placeholder="0"
              aria-invalid={!!errors.stock}
              aria-describedby={errors.stock ? "error-stock" : undefined}
              className={`${fieldClass("stock")} sm:w-40`}
            />
            {errors.stock && (
              <p id="error-stock" className="mt-1 text-xs font-semibold text-red-600">
                {errors.stock}
              </p>
            )}
          </label>

          <label className="text-sm">
            <span className="font-semibold text-slate-700">Descripción</span>
            <textarea
              value={form.description}
              onChange={setField("description")}
              className={fieldClass("description")}
              rows={3}
            />
          </label>
        </div>

        <div className="flex items-center gap-2.5 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Guardando..." : "Guardar producto"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ImportModal({
  step,
  parsed,
  saving,
  onClose,
  onFile,
  onDownloadTemplate,
  onConfirm,
  onFinish,
}) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg animate-scale-in rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-extrabold text-slate-900">
            Importar productos
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-700"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-5 pt-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1.5 flex-1 rounded-full ${step >= n ? "bg-blue-600" : "bg-slate-200"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="flex flex-col items-center gap-4 p-5 text-center">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) onFile(file);
              }}
              className={`flex w-full flex-col items-center gap-2.5 rounded-2xl border-2 border-dashed p-9 transition-colors ${
                dragOver ? "border-blue-400 bg-blue-50" : "border-slate-300"
              }`}
            >
              <UploadCloud className="h-9 w-9 text-slate-400" />
              <div className="text-[15px] font-bold text-slate-900">
                Arrastra tu archivo aquí
              </div>
              <div className="text-[13.5px] text-slate-500">Formato CSV</div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 rounded-lg bg-blue-600 px-4.5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                Seleccionar archivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
                className="hidden"
              />
            </div>
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="text-[13.5px] font-semibold text-blue-600 underline hover:text-blue-700"
            >
              Descargar plantilla de ejemplo
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3.5 p-5">
            <div className="flex gap-2.5">
              <div className="flex-1 rounded-lg bg-emerald-50 p-3.5 text-center">
                <div className="text-2xl font-extrabold tabular-nums text-emerald-600">
                  {parsed.valid.length}
                </div>
                <div className="text-[12.5px] font-semibold text-emerald-800">
                  Listos para importar
                </div>
              </div>
              <div className="flex-1 rounded-lg bg-red-50 p-3.5 text-center">
                <div className="text-2xl font-extrabold tabular-nums text-red-600">
                  {parsed.errors.length}
                </div>
                <div className="text-[12.5px] font-semibold text-red-700">
                  Con errores
                </div>
              </div>
            </div>
            {parsed.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-100">
                {parsed.errors.map((er, i) => (
                  <div
                    key={i}
                    className="flex gap-2 border-b border-slate-100 px-3.5 py-2.5 text-sm last:border-0"
                  >
                    <span className="shrink-0 font-bold text-slate-800">
                      Fila {er.row}
                    </span>
                    <span className="text-red-700">{er.reason}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Las filas con errores no se importarán. Puedes corregir el
              archivo y volver a intentarlo.
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center gap-3.5 p-9 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="text-lg font-extrabold text-slate-900">
              {parsed.valid.length} productos importados
            </div>
            <div className="text-sm text-slate-500">
              Ya puedes verlos en tu lista de productos.
            </div>
          </div>
        )}

        {step > 1 && (
          <div className="flex items-center gap-2.5 border-t border-slate-100 px-5 py-4">
            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={saving || parsed.valid.length === 0}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving
                    ? "Importando..."
                    : `Importar ${parsed.valid.length} productos`}
                </button>
              </>
            )}
            {step === 3 && (
              <button
                type="button"
                onClick={onFinish}
                className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                Ver productos
              </button>
            )}
          </div>
        )}
      </div>
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