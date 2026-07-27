"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/services/products.service";
import { uid } from "@/utils/id";
import { downloadCSV, parseCSV } from "@/utils/csv";
import { openPrintWindow } from "@/utils/print";
import { useToasts } from "@/hooks/useToasts";
import { useProductFilters } from "@/hooks/useProductFilters";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";
import ToastStack from "@/components/ui/ToastStack";
import BarcodeScanModal from "@/components/products/BarcodeScanModal";
import ImportModal from "@/components/products/ImportModal";
import ProductForm from "@/components/products/ProductForm";
import ProductsCardList from "@/components/products/ProductsCardList";
import ProductsEmptyState from "@/components/products/ProductsEmptyState";
import ProductsFilters from "@/components/products/ProductsFilters";
import ProductsHeader from "@/components/products/ProductsHeader";
import ProductsSkeleton from "@/components/products/ProductsSkeleton";
import ProductsTable from "@/components/products/ProductsTable";
import ProductsToolbar from "@/components/products/ProductsToolbar";
import SelectionBar from "@/components/products/SelectionBar";
import {
  CSV_TEMPLATE_ROWS,
  buildProductsCSV,
  buildProductsPrintHTML,
  validateImportRow,
} from "@/components/products/productsUtils";

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
  - Esta página coordina el estado y habla con el servicio; el dibujo vive en
    components/products y el filtrado en useProductFilters.
*/

// La API ya devuelve el motivo real en español ("Ya tienes otro producto con
// ese SKU", "El precio no puede ser negativo"...) y apiFetch lo pone en
// err.message. Mostrar un genérico en su lugar obligaba a abrir la consola
// para saber qué corregir.
const errorText = (err, fallback) => {
  const message = err instanceof Error ? err.message.trim() : "";
  return message ? `${fallback}: ${message}` : fallback;
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const filters = useProductFilters(products);
  const { pageItems, filtered } = filters;

  const [selected, setSelected] = useState(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);

  // formulario / diálogo de confirmación
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  // registro por código de barras: el modal de escaneo y lo que ese escaneo
  // dejó listo para el formulario (null cuando se abre el formulario vacío)
  const [scanOpen, setScanOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);

  // importación
  const [importOpen, setImportOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [importParsed, setImportParsed] = useState({ valid: [], errors: [] });
  const [importSaving, setImportSaving] = useState(false);

  const { toasts, push, dismiss } = useToasts({ duration: 5000 });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      setProducts(res || []);
    } catch (err) {
      console.error(err);
      push(errorText(err, "No se pudo cargar productos"), "error");
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
      filters.setStockOp(qOp);
      filters.setStockVal(qVal);
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

  // cerrar modales con Escape, del más superficial al más profundo
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (confirm) setConfirm(null);
      else if (importOpen) setImportOpen(false);
      else if (scanOpen) setScanOpen(false);
      else if (showForm) closeForm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, showForm, importOpen, scanOpen]);

  /* --- selección --- */

  const toggleSelect = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());
  const allPageSelected =
    pageItems.length > 0 && pageItems.every((p) => selected.has(p.id));
  const somePageSelected =
    pageItems.some((p) => selected.has(p.id)) && !allPageSelected;
  const toggleSelectAllPage = () => {
    if (allPageSelected) return clearSelection();
    setSelected((s) => {
      const next = new Set(s);
      pageItems.forEach((p) => next.add(p.id));
      return next;
    });
  };

  /* --- stock rápido (optimista) --- */

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
      push(errorText(err, "Error actualizando stock"), "error");
    }
  };

  /* --- exportar --- */

  const exportCSV = () => {
    downloadCSV(
      `productos_${new Date().toISOString().slice(0, 10)}.csv`,
      buildProductsCSV(filtered),
    );
    push(`CSV con ${filtered.length} productos descargado`, "success");
  };

  const exportPDF = () => {
    if (!openPrintWindow(buildProductsPrintHTML(filtered))) {
      push("Permite las ventanas emergentes para exportar el PDF", "error");
      return;
    }
    push("Preparando PDF...", "info");
  };

  const downloadTemplate = () =>
    downloadCSV("plantilla_productos.csv", CSV_TEMPLATE_ROWS);

  /* --- CRUD, optimista y esperando la respuesta para dar feedback real --- */

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
        push(errorText(err, "Error actualizando producto"), "error");
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
        push(errorText(err, "Error creando producto"), "error");
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
      push(errorText(err, "Error eliminando producto"), "error");
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
      push(errorText(err, "Error en eliminación masiva"), "error");
    }
  };

  /* --- formulario --- */

  const openNewForm = () => {
    setEditing(null);
    setPrefill(null);
    setShowForm(true);
  };
  const openEditForm = (product) => {
    setEditing(product);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setPrefill(null);
  };

  /* --- registro por código de barras --- */

  // El catálogo propio se revisa antes de salir a preguntar afuera: dos
  // productos con el mismo código dejarían al lector de Ventas sin saber cuál
  // cobrar, y eso es peor que no registrar nada.
  const findByBarcode = (code) => {
    const target = String(code).trim();
    return products.find((p) => (p.barcode || "").trim() === target) ?? null;
  };

  // Lo mismo pero para el formulario, donde el código también se puede escribir
  // a mano y hay que dejar que un producto conserve el suyo al editarlo.
  const barcodeOwner = (code, exceptId) => {
    const target = String(code ?? "").trim();
    if (!target) return null;
    return (
      products.find(
        (p) => (p.barcode || "").trim() === target && p.id !== exceptId,
      ) ?? null
    );
  };

  // El SKU también tiene que ser único, pero solo dentro de esta tienda: el
  // catálogo cargado acá ya viene filtrado por tienda, así que buscar en él es
  // exactamente lo que valida la base. Se compara sin mayúsculas ni espacios,
  // igual que el índice de Postgres.
  const skuOwner = (sku, exceptId) => {
    const target = String(sku ?? "").trim().toLowerCase();
    if (!target) return null;
    return (
      products.find(
        (p) => (p.sku || "").trim().toLowerCase() === target && p.id !== exceptId,
      ) ?? null
    );
  };

  // Lo que trajo la consulta pasa al formulario como propuesta, no como hecho:
  // queda marcado en pantalla y quien registra lo confirma antes de guardar.
  const openScannedForm = (found) => {
    const values = {};
    for (const [key, value] of Object.entries({
      barcode: found.barcode,
      name: found.name,
      category: found.category,
      description: found.description,
      photo: found.photo,
    })) {
      if (value) values[key] = value;
    }
    setScanOpen(false);
    setEditing(null);
    setPrefill({ values, source: found.source });
    setShowForm(true);
  };

  // Sin ficha pública, pero el código escaneado sirve igual: se arrastra al
  // formulario para no tener que volver a pasar el lector.
  const openManualForm = (barcode) => {
    setScanOpen(false);
    setEditing(null);
    setPrefill(barcode ? { values: { barcode }, source: null } : null);
    setShowForm(true);
  };

  const openExistingFromScan = (product) => {
    setScanOpen(false);
    setPrefill(null);
    setEditing(product);
    setShowForm(true);
  };

  /* --- importar CSV --- */

  const handleImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(String(reader.result || ""));
      if (!rows.length) {
        push("El archivo está vacío", "error");
        return;
      }
      const headers = rows[0].map((h) => h.trim().toLowerCase());
      const valid = [];
      const errors = [];
      rows.slice(1).forEach((r, idx) => {
        const obj = {};
        headers.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
        const reason = validateImportRow(obj);
        if (reason) {
          // +2 porque la fila 1 es el encabezado y quien corrige el archivo
          // cuenta desde 1, no desde 0.
          errors.push({ row: idx + 2, reason });
        } else {
          valid.push({
            name: obj.name,
            sku: obj.sku,
            barcode: obj.barcode || "",
            category: obj.category || "",
            cost_price: Number(obj.cost_price),
            // Un costo que viene en el archivo importado es un dato aportado,
            // no el estimado que calcula el importador del Excel.
            cost_is_estimated: false,
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
    <>
      <div className="l mx-auto">
        <ProductsHeader
          totalCount={products.length}
          loading={loading}
          canExport={filtered.length > 0}
          onRefresh={fetchProducts}
          onImport={() => setImportOpen(true)}
          onExportCSV={exportCSV}
          onExportPDF={exportPDF}
          onScan={() => setScanOpen(true)}
          onNew={openNewForm}
        />

        <ProductsToolbar
          query={filters.query}
          onQueryChange={filters.setQuery}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((s) => !s)}
          activeFilterCount={filters.activeFilterCount}
          filterChips={filters.filterChips}
          onClearAll={filters.clearAllFilters}
        />

        <ProductsFilters
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          categories={filters.categories}
          categoryFilter={filters.categoryFilter}
          onCategoryFilterChange={filters.setCategoryFilter}
          minPrice={filters.minPrice}
          onMinPriceChange={filters.setMinPrice}
          maxPrice={filters.maxPrice}
          onMaxPriceChange={filters.setMaxPrice}
          stockOp={filters.stockOp}
          onStockOpChange={filters.setStockOp}
          stockVal={filters.stockVal}
          onStockValChange={filters.setStockVal}
          onClearAll={filters.clearAllFilters}
        />

        <SelectionBar
          count={selected.size}
          onClear={clearSelection}
          onDelete={() => setConfirm({ type: "bulk-delete" })}
        />

        {!loading && pageItems.length > 0 && (
          <>
            <ProductsTable
              items={pageItems}
              selected={selected}
              allPageSelected={allPageSelected}
              somePageSelected={somePageSelected}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAllPage}
              sortBy={filters.sortBy}
              sortDir={filters.sortDir}
              onSort={filters.toggleSort}
              onStockCommit={quickUpdateStock}
              onEdit={openEditForm}
              onDelete={(p) => setConfirm({ type: "delete", payload: p })}
            />
            <ProductsCardList
              items={pageItems}
              selected={selected}
              onToggleSelect={toggleSelect}
              onStockCommit={quickUpdateStock}
              onEdit={openEditForm}
              onDelete={(p) => setConfirm({ type: "delete", payload: p })}
            />
          </>
        )}

        {loading && <ProductsSkeleton />}

        {!loading && pageItems.length === 0 && (
          <ProductsEmptyState
            hasActiveSearch={filters.hasActiveSearch}
            onClearFilters={filters.clearAllFilters}
          />
        )}

        {!loading && filtered.length > 0 && (
          <Pagination
            page={filters.page}
            totalPages={filters.totalPages}
            perPage={filters.perPage}
            total={filtered.length}
            onPageChange={filters.setPage}
          />
        )}
      </div>

      {scanOpen && (
        <BarcodeScanModal
          findByBarcode={findByBarcode}
          onClose={() => setScanOpen(false)}
          onUse={openScannedForm}
          onManual={openManualForm}
          onEditExisting={openExistingFromScan}
        />
      )}

      {showForm && (
        <ProductForm
          initial={editing}
          prefill={prefill}
          barcodeOwner={barcodeOwner}
          skuOwner={skuOwner}
          existingCategories={filters.categories.filter((c) => c !== "All")}
          onClose={closeForm}
          onSave={async (p) => {
            await handleSave(p);
            closeForm();
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm.type === "delete") handleDelete(confirm.payload);
            else handleBulkDelete();
            setConfirm(null);
          }}
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

      <ToastStack toasts={toasts} onDismiss={dismiss} accent="blue" />
    </>
  );
}
