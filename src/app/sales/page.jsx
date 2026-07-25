// SalePageEnhanced.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { getProducts, updateProduct } from "@/services/products.service";
import { getSales, createSaleWithDetails } from "@/services/sales.service";
import { currency, formatMoney } from "@/utils/converts";

import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  DollarSign,
  Search,
  Printer,
  Tag,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";

/*
  SalePageEnhanced
  - Flujo guiado con navegación por teclado (Enter avanza de campo en campo,
    nunca envía el formulario por accidente), validación por línea visible,
    control de doble envío y sincronización de stock tras registrar la venta.
  - Usa servicios: getSales(), createSaleWithDetails(), getProducts(), updateProduct()
*/

const uid = () => Math.random().toString(36).slice(2, 9);
const makeEmptyLine = () => ({
  _key: uid(),
  id: "",
  product: "",
  sku: "",
  quantity: 1,
  price: 0,
  sale_price: 0,
  stock: 0,
});
const CASH_CHIPS = [5000, 10000, 20000, 50000, 100000];

export default function SalePageEnhanced() {
  // data
  const [allProducts, setAllProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);

  // venta en curso
  const [lines, setLines] = useState([makeEmptyLine()]);
  const [lineErrors, setLineErrors] = useState({});
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // suggestions + UI
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [focusedLineIndex, setFocusedLineIndex] = useState(null);

  // small toasts (local)
  const [toasts, setToasts] = useState([]);
  const pushToast = (text, type = "info") => {
    const id = uid();
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  // refs indexadas por _key (estable), no por posición: evitar que el foco
  // "salte" a la línea equivocada al agregar/quitar líneas en medio de la lista
  const fieldRefs = useRef({});

  // FETCH initial data
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoadingSales(true);
      try {
        const p = await getProducts();
        const s = await getSales();
        if (!mounted) return;
        setAllProducts(Array.isArray(p) ? p : []);
        setSales(Array.isArray(s) ? s : []);
      } catch (err) {
        console.error("Error fetching sales/products:", err);
        pushToast("No se pudo cargar datos. Revisa conexión.", "error");
      } finally {
        if (mounted) setLoadingSales(false);
      }
    };
    fetchData();
    return () => (mounted = false);
  }, []);

  // Derived totals
  const totals = useMemo(() => {
    const total = lines.reduce(
      (acc, l) => acc + (Number(l.sale_price) || 0) * (Number(l.quantity) || 0),
      0,
    );
    const cost = lines.reduce(
      (acc, l) => acc + (Number(l.price) || 0) * (Number(l.quantity) || 0),
      0,
    );
    const gain = total - cost;
    const change = Number(receivedAmount || 0) - total;
    return { total, gain, cost, change };
  }, [lines, receivedAmount]);

  const hasProducts = lines.some((l) => l.id);

  // suggestions logic
  const updateSuggestions = (text, lineIndex) => {
    if (!text || !allProducts.length) {
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
      return;
    }
    const q = text.toLowerCase();
    const filtered = allProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q),
      )
      // exclude products already on the sale unless it's the same line
      .filter(
        (p) =>
          !lines.some(
            (l, idx) => idx !== lineIndex && String(l.id) === String(p.id),
          ),
      );
    setSuggestions(filtered.slice(0, 8));
    setActiveSuggestionIndex(filtered.length ? 0 : -1);
  };

  const clearLineError = (index) =>
    setLineErrors((prev) => {
      if (!(index in prev)) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });

  // keyboard navigation for suggestions + avance guiado entre campos
  const onKeyDownProduct = (e, lineIndex) => {
    if (suggestions.length && focusedLineIndex === lineIndex) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
          pickSuggestion(lineIndex, suggestions[activeSuggestionIndex]);
        }
        return;
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        return;
      }
    }
    // Enter sin sugerencias activas: nunca debe enviar el formulario,
    // solo avanzar a Cantidad (el precio ya no es editable)
    if (e.key === "Enter") {
      e.preventDefault();
      const key = lines[lineIndex]?._key;
      fieldRefs.current[key]?.qty?.focus();
    }
  };

  const onKeyDownQty = (e, lineIndex) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (lineIndex === lines.length - 1) {
      addLine(lineIndex);
    } else {
      const nextKey = lines[lineIndex + 1]?._key;
      fieldRefs.current[nextKey]?.prod?.focus();
    }
  };

  const pickSuggestion = (lineIndex, product) => {
    const key = lines[lineIndex]?._key;
    setLines((prev) =>
      prev.map((l, idx) =>
        idx === lineIndex
          ? {
              ...l,
              id: product.id,
              product: product.name,
              sku: product.sku || "",
              sale_price: Number(product.price ?? 0),
              price: Number(product.cost_price ?? 0),
              stock: Number(product.stock ?? 0),
            }
          : l,
      ),
    );
    clearLineError(lineIndex);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    setTimeout(() => fieldRefs.current[key]?.qty?.focus(), 40);
  };

  // Add / remove lines
  const addLine = (atIndex = null) => {
    const newLine = makeEmptyLine();
    setLines((prev) => {
      const next = [...prev];
      if (atIndex === null) next.push(newLine);
      else next.splice(atIndex + 1, 0, newLine);
      return next;
    });
    setTimeout(() => fieldRefs.current[newLine._key]?.prod?.focus(), 80);
  };

  const removeLine = (index) => {
    const key = lines[index]?._key;
    if (lines.length === 1) {
      // clear instead of removing last
      setLines([makeEmptyLine()]);
    } else {
      setLines((prev) => prev.filter((_, i) => i !== index));
    }
    delete fieldRefs.current[key];
    clearLineError(index);
  };

  // update a field
  const updateLine = (index, changes) => {
    setLines((prev) =>
      prev.map((l, idx) => (idx === index ? { ...l, ...changes } : l)),
    );
    clearLineError(index);
  };

  // Quick increment/decrement for quantity
  const incQty = (index, delta) => {
    updateLine(index, {
      quantity: Math.max(1, (Number(lines[index].quantity) || 0) + delta),
    });
  };

  // Validate before submit: devuelve un error general y/o errores por línea
  const validateSale = () => {
    const errors = {};
    lines.forEach((l, i) => {
      if (!l.product.trim()) {
        errors[i] = "Falta el producto";
      } else if (!l.id) {
        errors[i] = "Selecciona el producto de la lista de sugerencias";
      } else if (!Number(l.quantity) || Number(l.quantity) <= 0) {
        errors[i] = "Cantidad inválida";
      } else if (!Number(l.sale_price) || Number(l.sale_price) < 0) {
        errors[i] = "Precio inválido";
      } else if (Number(l.quantity) > Number(l.stock || 0)) {
        errors[i] = `Stock insuficiente (${l.stock} disponibles)`;
      }
    });
    return errors;
  };

  // Submit sale (with confirmation)
  const submitSale = async () => {
    if (submitting) return;
    const errors = validateSale();
    setLineErrors(errors);
    if (Object.keys(errors).length > 0) {
      pushToast("Revisa los productos marcados en rojo", "error");
      const firstIdx = Number(Object.keys(errors)[0]);
      fieldRefs.current[lines[firstIdx]?._key]?.prod?.focus();
      return;
    }

    const total = totals.total;
    if (Number(receivedAmount || 0) < total) {
      const { isConfirmed } = await Swal.fire({
        title: "Pago insuficiente",
        text: `El monto recibido (${currency(receivedAmount)}) es menor al total (${currency(total)}). ¿Deseas continuar?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Continuar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;
    }

    const confirmResult = await Swal.fire({
      title: "Confirmar venta",
      html: `<strong>Total:</strong> ${currency(total)}<br/><strong>Recibido:</strong> ${currency(receivedAmount)}<br/><strong>Vuelto:</strong> ${currency(totals.change)}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Registrar venta",
      cancelButtonText: "Cancelar",
    });
    if (!confirmResult.isConfirmed) return;

    const soldLines = lines.filter((l) => l.id);
    const salePayload = {
      total_amount: Number(total),
      sale_date: new Date().toISOString(),
      gain: Number(totals.gain),
    };
    const productsFormat = soldLines.map((l) => ({
      product_id: l.id,
      quantity: Number(l.quantity) || 0,
      sale_price: Number(l.sale_price) || 0,
    }));

    setSubmitting(true);
    try {
      await createSaleWithDetails(salePayload, productsFormat);

      // sincroniza el stock vendido en el catálogo
      await Promise.all(
        soldLines.map((l) => {
          const current = allProducts.find((p) => String(p.id) === String(l.id));
          const newStock = Math.max(
            0,
            (current?.stock ?? Number(l.stock)) - Number(l.quantity),
          );
          return updateProduct(l.id, { stock: newStock }).catch((err) =>
            console.error("No se pudo sincronizar el stock:", err),
          );
        }),
      );

      const [updatedSales, updatedProducts] = await Promise.all([
        getSales(),
        getProducts(),
      ]);
      setSales(Array.isArray(updatedSales) ? updatedSales : []);
      setAllProducts(Array.isArray(updatedProducts) ? updatedProducts : []);

      Swal.fire({
        icon: "success",
        title: "Venta registrada",
        html: `Total: ${currency(total)}<br/>Vuelto: ${currency(totals.change)}`,
        timer: 2200,
        showConfirmButton: false,
      });

      setLines([makeEmptyLine()]);
      setLineErrors({});
      setReceivedAmount(0);
    } catch (err) {
      console.error("Error creating sale:", err);
      pushToast("Error registrando venta. Intenta de nuevo.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const printReceipt = () => {
    const soldLines = lines.filter((l) => l.id);
    if (!soldLines.length) {
      pushToast("Agrega productos antes de imprimir el recibo", "error");
      return;
    }
    const rows = soldLines
      .map(
        (l) =>
          `<tr><td>${l.product}</td><td style="text-align:center">${l.quantity}</td><td style="text-align:right">${currency(l.sale_price)}</td><td style="text-align:right">${currency(l.sale_price * l.quantity)}</td></tr>`,
      )
      .join("");
    const html = `<html><head><meta charset="utf-8"><title>Recibo</title>
      <style>
        body{font-family:system-ui,-apple-system,Roboto,'Helvetica Neue',Arial;width:300px;margin:0 auto;padding:16px;color:#111}
        h2{font-size:16px;margin:0 0 4px}
        table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}
        th,td{padding:4px 0}
        th{text-align:left;border-bottom:1px solid #ccc}
        tfoot td{border-top:1px solid #ccc;font-weight:bold;padding-top:6px}
        .muted{color:#666;font-size:11px}
      </style></head><body>
      <h2>Recibo de venta</h2>
      <div class="muted">${new Date().toLocaleString("es-CO")}</div>
      <table>
        <thead><tr><th>Producto</th><th>Cant.</th><th style="text-align:right">Precio</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="3">Total</td><td style="text-align:right">${currency(totals.total)}</td></tr>
          <tr><td colspan="3">Recibido</td><td style="text-align:right">${currency(receivedAmount)}</td></tr>
          <tr><td colspan="3">Vuelto</td><td style="text-align:right">${currency(Math.max(0, totals.change))}</td></tr>
        </tfoot>
      </table>
      <p class="muted" style="margin-top:16px;text-align:center">¡Gracias por su compra!</p>
      </body></html>`;

    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      pushToast("Permite las ventanas emergentes para imprimir el recibo", "error");
      return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  // suggestion watcher (when product input changes)
  useEffect(() => {
    setActiveSuggestionIndex((i) =>
      i >= suggestions.length ? suggestions.length - 1 : i,
    );
  }, [suggestions]);

  const totalItems = lines.reduce(
    (acc, l) => acc + (Number(l.quantity) || 0),
    0,
  );
  const totalSalesCount = sales.length;
  const totalSalesAmount = useMemo(
    () => sales.reduce((a, s) => a + (s.total_amount || 0), 0),
    [sales],
  );

  const RecentSales = () => (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          Historial de ventas
        </h3>
        <div className="text-xs text-slate-400">
          {loadingSales ? "" : `${sales.length} registros`}
        </div>
      </div>

      <div className="space-y-2">
        {loadingSales ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100"
            >
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
            </div>
          ))
        ) : sales.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-100">
            Aún no hay ventas registradas.
          </div>
        ) : (
          <div className="divide-y rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
            {sales.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-2 p-3 hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">
                    {s.products.map((p) => `${p.product} (${p.quantity})`).join(", ")}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {new Date(s.sale_date).toLocaleString("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold tabular-nums text-slate-800">
                    {currency(s.total_amount)}
                  </div>
                  <div className="text-xs tabular-nums text-emerald-600">
                    +{currency(s.gain)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: Formulario de venta */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-teal-600 p-2 text-white">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    Registrar venta
                  </h1>
                  <div className="text-xs text-slate-500">
                    Añade productos, confirma cantidades y registra el pago.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Limpiar venta actual"
                  disabled={submitting}
                  onClick={() => {
                    setLines([makeEmptyLine()]);
                    setLineErrors({});
                    setReceivedAmount(0);
                  }}
                  className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Limpiar
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => addLine()}
                  className="flex items-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Añadir línea
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitSale();
              }}
              className="space-y-3"
            >
              {lines.map((line, idx) => {
                const error = lineErrors[idx];
                const showSuggestions =
                  focusedLineIndex === idx && !line.id && line.product.trim() !== "";
                return (
                  <div
                    key={line._key}
                    className={`relative animate-fade-slide-up rounded-md border p-3 transition-colors ${
                      error
                        ? "border-red-300 bg-red-50/60"
                        : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex w-6 flex-shrink-0 items-center justify-center pt-2">
                        <div className="text-xs text-slate-400">{idx + 1}</div>
                      </div>

                      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-12">
                        {/* Producto */}
                        <div className="sm:col-span-6">
                          <label className="text-xs font-semibold text-slate-600">
                            Producto
                          </label>
                          <div className="relative">
                            <div
                              className={`flex items-center gap-2 rounded-md border bg-white px-2 focus-within:ring-2 ${
                                error
                                  ? "border-red-300 focus-within:ring-red-100"
                                  : "border-slate-200 focus-within:border-teal-400 focus-within:ring-teal-100"
                              }`}
                            >
                              <Search className="h-4 w-4 shrink-0 text-slate-300" />
                              <input
                                ref={(el) => {
                                  fieldRefs.current[line._key] = {
                                    ...fieldRefs.current[line._key],
                                    prod: el,
                                  };
                                }}
                                type="text"
                                role="combobox"
                                aria-expanded={showSuggestions}
                                aria-controls={`suggestions-${line._key}`}
                                aria-autocomplete="list"
                                aria-activedescendant={
                                  showSuggestions && activeSuggestionIndex >= 0
                                    ? `suggestion-${line._key}-${activeSuggestionIndex}`
                                    : undefined
                                }
                                className="w-full px-2 py-2 text-sm outline-none"
                                placeholder="Escribe nombre o SKU..."
                                value={line.product}
                                onChange={(e) => {
                                  updateLine(idx, {
                                    product: e.target.value,
                                    id: "",
                                    sku: "",
                                    sale_price: 0,
                                    price: 0,
                                    stock: 0,
                                  });
                                  updateSuggestions(e.target.value, idx);
                                }}
                                onFocus={() => {
                                  setFocusedLineIndex(idx);
                                  if (!line.id) updateSuggestions(line.product, idx);
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setSuggestions([]);
                                    setActiveSuggestionIndex(-1);
                                    setFocusedLineIndex(null);
                                  }, 150);
                                }}
                                onKeyDown={(e) => onKeyDownProduct(e, idx)}
                                aria-label={`Producto línea ${idx + 1}`}
                              />
                              {line.sku && (
                                <div className="shrink-0 px-2 text-xs text-slate-400">
                                  {line.sku}
                                </div>
                              )}
                            </div>

                            {showSuggestions && (
                              <div
                                id={`suggestions-${line._key}`}
                                role="listbox"
                                className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg"
                              >
                                {suggestions.length === 0 ? (
                                  <div className="px-3 py-3 text-sm text-slate-400">
                                    No se encontraron productos con ese nombre o SKU.
                                  </div>
                                ) : (
                                  suggestions.map((s, sidx) => (
                                    <button
                                      key={s.id}
                                      id={`suggestion-${line._key}-${sidx}`}
                                      role="option"
                                      aria-selected={sidx === activeSuggestionIndex}
                                      type="button"
                                      onMouseDown={(ev) => {
                                        ev.preventDefault();
                                        pickSuggestion(idx, s);
                                      }}
                                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-teal-50 ${sidx === activeSuggestionIndex ? "bg-teal-50" : ""}`}
                                    >
                                      <div className="min-w-0">
                                        <div className="truncate font-medium text-slate-800">
                                          {s.name}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                          {s.category || ""} {s.sku ? `• ${s.sku}` : ""}
                                        </div>
                                      </div>
                                      <div className="shrink-0 pl-2 text-right text-sm text-slate-600">
                                        <div className="tabular-nums">
                                          {currency(s.price ?? 0)}
                                        </div>
                                        <div
                                          className={`text-xs tabular-nums ${s.stock <= 5 ? "font-medium text-red-600" : "text-slate-500"}`}
                                        >
                                          {s.stock} en stock
                                        </div>
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Precio: fijo desde el catálogo, no editable */}
                        <div className="sm:col-span-2">
                          <div className="text-xs font-semibold text-slate-600">
                            Precio
                          </div>
                          <div
                            className="mt-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-1.5 text-right text-sm font-medium tabular-nums text-slate-700"
                            title="El precio de venta viene del catálogo de productos"
                          >
                            {line.id ? currency(line.sale_price) : "—"}
                          </div>
                        </div>

                        {/* Cantidad */}
                        <div className="sm:col-span-4">
                          <label className="text-xs font-semibold text-slate-600">
                            Cantidad
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label="Disminuir cantidad"
                              onClick={() => incQty(idx, -1)}
                              className="shrink-0 rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              ref={(el) => {
                                fieldRefs.current[line._key] = {
                                  ...fieldRefs.current[line._key],
                                  qty: el,
                                };
                              }}
                              type="number"
                              min="1"
                              onKeyDown={(e) => onKeyDownQty(e, idx)}
                              className="no-spinner w-16 min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1 text-right outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                              value={line.quantity}
                              onChange={(e) =>
                                updateLine(idx, {
                                  quantity: Math.max(1, Number(e.target.value)),
                                })
                              }
                              aria-label={`Cantidad línea ${idx + 1}`}
                            />
                            <button
                              type="button"
                              aria-label="Aumentar cantidad"
                              onClick={() => incQty(idx, 1)}
                              className="shrink-0 rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {line.id ? `${line.stock} disponibles` : ""}
                          </div>
                        </div>

                        {/* acciones */}
                        <div className="mt-1 flex items-center justify-between sm:col-span-12">
                          {error ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                              {error}
                            </div>
                          ) : (
                            <span />
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="Agregar línea debajo"
                              aria-label="Agregar línea debajo"
                              disabled={submitting}
                              onClick={() => addLine(idx)}
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Eliminar línea"
                              aria-label="Eliminar línea"
                              disabled={submitting}
                              onClick={() => removeLine(idx)}
                              className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Resumen del pedido, estilo factura */}
              {hasProducts && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <h3 className="text-xs font-semibold text-slate-600">
                    Resumen del pedido
                  </h3>
                  <ul className="mt-2 divide-y divide-slate-200">
                    {lines
                      .filter((l) => l.id)
                      .map((l) => (
                        <li
                          key={l._key}
                          className="flex items-center justify-between gap-3 py-1.5 text-sm"
                        >
                          <span className="min-w-0 truncate text-slate-700">
                            {l.product}
                          </span>
                          <span className="shrink-0 tabular-nums text-slate-600">
                            {currency(l.sale_price)} · {l.quantity} und
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Pago */}
              <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-slate-100 p-2">
                    <DollarSign className="h-5 w-5 text-teal-700" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Monto recibido</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-sm text-slate-500">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={receivedAmount ? formatMoney(receivedAmount) : ""}
                        onChange={(e) => {
                          const numeric =
                            Number(String(e.target.value).replace(/[^\d]/g, "")) || 0;
                          setReceivedAmount(numeric);
                        }}
                        className="w-36 rounded-md border border-slate-200 px-3 py-2 text-right font-semibold text-teal-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                        placeholder="0"
                        aria-label="Monto recibido"
                      />
                      {receivedAmount > 0 && (
                        <button
                          type="button"
                          aria-label="Limpiar monto recibido"
                          onClick={() => setReceivedAmount(0)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={totals.total <= 0}
                        onClick={() => setReceivedAmount(Math.ceil(totals.total))}
                        className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Monto exacto
                      </button>
                      {CASH_CHIPS.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() =>
                            setReceivedAmount((r) => (Number(r) || 0) + amount)
                          }
                          className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          +{formatMoney(amount)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Vuelto</div>
                  {receivedAmount > 0 ? (
                    <div
                      className={`flex items-center justify-end gap-1.5 text-lg font-bold tabular-nums ${totals.change < 0 ? "text-red-600" : "text-teal-700"}`}
                    >
                      {totals.change < 0 ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {currency(totals.change)}
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-slate-300">—</div>
                  )}
                </div>
              </div>

              {/* resumen y acciones */}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-slate-100 px-3 py-2">
                    <div className="text-xs text-slate-500">Items</div>
                    <div className="text-lg font-bold tabular-nums text-slate-800">
                      {totalItems}
                    </div>
                  </div>

                  <div className="rounded-md bg-slate-100 px-3 py-2">
                    <div className="text-xs text-slate-500">Ganancia estimada</div>
                    <div className="text-lg font-bold tabular-nums text-slate-800">
                      {currency(totals.gain)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="text-2xl font-extrabold tabular-nums text-teal-700">
                      {currency(totals.total)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row">
                    <button
                      type="submit"
                      disabled={submitting || !hasProducts}
                      className="flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {submitting ? "Registrando..." : "Registrar venta"}
                    </button>
                    <button
                      type="button"
                      disabled={!hasProducts}
                      onClick={printReceipt}
                      className="flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Printer className="h-4 w-4" /> Recibo
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Side panel - resumen + historial */}
        <aside>
          <div className="sticky top-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Total histórico</div>
                  <div className="text-lg font-bold tabular-nums text-slate-800">
                    {currency(totalSalesAmount)}
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                {totalSalesCount} venta{totalSalesCount === 1 ? "" : "s"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setLines([makeEmptyLine()]);
                setLineErrors({});
                setReceivedAmount(0);
                pushToast("Venta limpiada", "info");
              }}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              Limpiar venta
            </button>

            <div className="mt-4">
              <RecentSales />
            </div>
          </div>
        </aside>
      </div>

      {/* Toaster */}
      <div
        aria-live="polite"
        role="status"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-slide-up rounded-md px-4 py-2 text-sm shadow ${t.type === "error" ? "bg-red-100 text-red-700" : t.type === "success" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
