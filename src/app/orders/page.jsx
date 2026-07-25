// OrdersPageEnhanced.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { getProducts } from "@/services/products.service";
import { getOrders, createOrderWithDetails } from "@/services/orders.service";
import { currency } from "@/utils/converts";

import {
  Truck,
  Plus,
  Minus,
  Trash2,
  Check,
  Search,
  Calendar,
  Printer,
  Tag,
  Loader2,
  AlertTriangle,
} from "lucide-react";

/*
 OrdersPageEnhanced
 - UI/UX: mismo flujo guiado que Sales (navegación por teclado, validación
   por línea, control de doble envío), adaptado a órdenes de compra a
   proveedor. No sincroniza stock: una orden es una solicitud, el stock
   solo debe subir cuando la mercancía se recibe (flujo no modelado aún).
 - Usa servicios: getOrders(), createOrderWithDetails(), getProducts()
*/

const uid = () => Math.random().toString(36).slice(2, 9);
const makeEmptyLine = () => ({
  _key: uid(),
  id: "",
  product: "",
  sku: "",
  quantity: 1,
  unit_cost: 0,
  stock: 0,
});

export default function OrdersPageEnhanced() {
  // data
  const [allProducts, setAllProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // order in progress
  const [lines, setLines] = useState([makeEmptyLine()]);
  const [lineErrors, setLineErrors] = useState({});
  const [supplier, setSupplier] = useState("");
  const [supplierError, setSupplierError] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // suggestions + UI
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [focusedLineIndex, setFocusedLineIndex] = useState(null);

  // local toasts
  const [toasts, setToasts] = useState([]);
  const pushToast = (text, type = "info") => {
    const id = uid();
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  // refs indexadas por _key (estable), no por posición
  const fieldRefs = useRef({});
  const supplierInputRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoadingOrders(true);
      try {
        const p = await getProducts();
        const ord = await getOrders();
        if (!mounted) return;
        setAllProducts(Array.isArray(p) ? p : []);
        setOrders(Array.isArray(ord) ? ord : []);
      } catch (err) {
        console.error("Error fetching orders/products:", err);
        pushToast("No se pudo cargar datos. Revisa conexión.", "error");
      } finally {
        if (mounted) setLoadingOrders(false);
      }
    };
    fetchData();
    return () => (mounted = false);
  }, []);

  // totals: total_cost of order
  const totals = useMemo(() => {
    const totalCost = lines.reduce(
      (acc, l) => acc + (Number(l.unit_cost) || 0) * (Number(l.quantity) || 0),
      0,
    );
    const items = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);
    return { totalCost, items };
  }, [lines]);

  const hasProducts = lines.some((l) => l.id);
  const knownSuppliers = useMemo(
    () => Array.from(new Set(orders.map((o) => o.supplier).filter(Boolean))),
    [orders],
  );

  // suggestions logic (igual que Sales)
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
    if (e.key === "Enter") {
      e.preventDefault();
      const key = lines[lineIndex]?._key;
      fieldRefs.current[key]?.qty?.focus();
    }
  };

  const onKeyDownQty = (e, lineIndex) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const key = lines[lineIndex]?._key;
    fieldRefs.current[key]?.cost?.focus();
  };

  const onKeyDownCost = (e, lineIndex) => {
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
              unit_cost: Number(product.cost_price ?? product.price ?? 0),
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
      setLines([makeEmptyLine()]);
    } else {
      setLines((prev) => prev.filter((_, i) => i !== index));
    }
    delete fieldRefs.current[key];
    clearLineError(index);
  };

  const updateLine = (index, changes) => {
    setLines((prev) =>
      prev.map((l, idx) => (idx === index ? { ...l, ...changes } : l)),
    );
    clearLineError(index);
  };

  const incQty = (index, delta) => {
    updateLine(index, {
      quantity: Math.max(1, (Number(lines[index].quantity) || 0) + delta),
    });
  };

  const validateOrderLines = () => {
    const errors = {};
    lines.forEach((l, i) => {
      if (!l.product.trim()) {
        errors[i] = "Falta el producto";
      } else if (!l.id) {
        errors[i] = "Selecciona el producto de la lista de sugerencias";
      } else if (!Number(l.quantity) || Number(l.quantity) <= 0) {
        errors[i] = "Cantidad inválida";
      } else if (!Number(l.unit_cost) || Number(l.unit_cost) < 0) {
        errors[i] = "Costo inválido";
      }
    });
    return errors;
  };

  const submitOrder = async () => {
    if (submitting) return;
    const supplierMissing = !supplier.trim();
    setSupplierError(supplierMissing ? "Ingresa el proveedor de la orden" : "");
    const errors = validateOrderLines();
    setLineErrors(errors);

    if (supplierMissing) {
      pushToast("Ingresa el proveedor de la orden", "error");
      supplierInputRef.current?.focus();
      return;
    }
    if (Object.keys(errors).length > 0) {
      pushToast("Revisa los productos marcados en rojo", "error");
      const firstIdx = Number(Object.keys(errors)[0]);
      fieldRefs.current[lines[firstIdx]?._key]?.prod?.focus();
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Confirmar orden",
      html: `<strong>Proveedor:</strong> ${supplier}<br/><strong>Total:</strong> ${currency(totals.totalCost || 0)}<br/><strong>Items:</strong> ${totals.items}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Registrar orden",
      cancelButtonText: "Cancelar",
    });
    if (!confirmResult.isConfirmed) return;

    const orderedLines = lines.filter((l) => l.id);
    const orderPayload = {
      total_amount: Number(totals.totalCost || 0),
      order_date: new Date().toISOString(),
      supplier,
      expected_delivery: expectedDelivery || null,
      notes: notes || "",
    };
    const productsFormat = orderedLines.map((l) => ({
      product_id: l.id,
      quantity: Number(l.quantity) || 0,
      unit_cost: Number(l.unit_cost) || 0,
    }));

    setSubmitting(true);
    try {
      await createOrderWithDetails(orderPayload, productsFormat);
      const updatedOrders = await getOrders();
      setOrders(Array.isArray(updatedOrders) ? updatedOrders : []);

      Swal.fire({
        icon: "success",
        title: "Orden registrada",
        html: `Total: ${currency(totals.totalCost)}`,
        timer: 2000,
        showConfirmButton: false,
      });

      setSupplier("");
      setExpectedDelivery("");
      setNotes("");
      setLines([makeEmptyLine()]);
      setLineErrors({});
    } catch (err) {
      console.error("Error creating order:", err);
      pushToast("Error registrando orden. Intenta de nuevo.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const printOrder = () => {
    const orderedLines = lines.filter((l) => l.id);
    if (!orderedLines.length) {
      pushToast("Agrega productos antes de imprimir la orden", "error");
      return;
    }
    const rows = orderedLines
      .map(
        (l) =>
          `<tr><td>${l.product}</td><td style="text-align:center">${l.quantity}</td><td style="text-align:right">${currency(l.unit_cost)}</td><td style="text-align:right">${currency(l.unit_cost * l.quantity)}</td></tr>`,
      )
      .join("");
    const html = `<html><head><meta charset="utf-8"><title>Orden de compra</title>
      <style>
        body{font-family:system-ui,-apple-system,Roboto,'Helvetica Neue',Arial;max-width:420px;margin:0 auto;padding:16px;color:#111}
        h2{font-size:16px;margin:0 0 4px}
        table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
        th,td{padding:4px 0}
        th{text-align:left;border-bottom:1px solid #ccc}
        tfoot td{border-top:1px solid #ccc;font-weight:bold;padding-top:6px}
        .muted{color:#666;font-size:11px}
        .meta{margin-top:8px;font-size:12px}
      </style></head><body>
      <h2>Orden de compra</h2>
      <div class="muted">${new Date().toLocaleString("es-CO")}</div>
      <div class="meta"><strong>Proveedor:</strong> ${supplier || "-"}</div>
      ${expectedDelivery ? `<div class="meta"><strong>Entrega esperada:</strong> ${new Date(expectedDelivery).toLocaleDateString("es-CO")}</div>` : ""}
      ${notes ? `<div class="meta"><strong>Notas:</strong> ${notes}</div>` : ""}
      <table>
        <thead><tr><th>Producto</th><th>Cant.</th><th style="text-align:right">Costo</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="3">Total</td><td style="text-align:right">${currency(totals.totalCost)}</td></tr>
        </tfoot>
      </table>
      </body></html>`;

    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      pushToast("Permite las ventanas emergentes para imprimir la orden", "error");
      return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  useEffect(() => {
    setActiveSuggestionIndex((i) =>
      i >= suggestions.length ? suggestions.length - 1 : i,
    );
  }, [suggestions]);

  const totalItems = lines.reduce(
    (acc, l) => acc + (Number(l.quantity) || 0),
    0,
  );
  const totalOrdersCount = orders.length;
  const totalOrdersAmount = useMemo(
    () => orders.reduce((a, o) => a + (o.total_amount || 0), 0),
    [orders],
  );

  const RecentOrders = () => (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          Órdenes recientes
        </h3>
        <div className="text-xs text-slate-400">
          {loadingOrders ? "" : `${orders.length} registros`}
        </div>
      </div>

      <div className="space-y-2">
        {loadingOrders ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-100"
            >
              <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
              <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-center text-sm text-slate-400 shadow-sm ring-1 ring-slate-100">
            Aún no hay órdenes registradas.
          </div>
        ) : (
          <div className="divide-y rounded-lg bg-white shadow-sm ring-1 ring-slate-100">
            {orders.slice(0, 8).map((o) => (
              <div
                key={o.id}
                className="flex items-start justify-between gap-2 p-3 hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">
                    {o.supplier || "Proveedor desconocido"}
                  </div>
                  <div className="mt-1 truncate text-xs text-slate-500">
                    {o.products.map((p) => `${p.product} (${p.quantity})`).join(", ")}
                  </div>
                  {o.expected_delivery && (
                    <div className="mt-1 text-xs text-slate-400">
                      Entrega: {new Date(o.expected_delivery).toLocaleDateString("es-CO")}
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold tabular-nums text-slate-800">
                    {currency(o.total_amount)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(o.order_date).toLocaleDateString("es-CO")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // UI render
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT: Order form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-indigo-600 p-2 text-white">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    Registrar orden
                  </h1>
                  <div className="text-xs text-slate-500">
                    Proveedor → productos → confirmar.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Limpiar"
                  disabled={submitting}
                  onClick={() => {
                    setLines([makeEmptyLine()]);
                    setLineErrors({});
                    setSupplier("");
                    setSupplierError("");
                    setExpectedDelivery("");
                    setNotes("");
                  }}
                  className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Limpiar
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => addLine()}
                  className="flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Añadir línea
                </button>
              </div>
            </div>

            {/* supplier + meta */}
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="md:col-span-2">
                <div className="text-xs font-semibold text-slate-600">
                  Proveedor <span className="text-red-500">*</span>
                </div>
                <input
                  ref={supplierInputRef}
                  list="known-suppliers"
                  value={supplier}
                  onChange={(e) => {
                    setSupplier(e.target.value);
                    if (supplierError) setSupplierError("");
                  }}
                  placeholder="Nombre del proveedor"
                  aria-invalid={!!supplierError}
                  aria-describedby={supplierError ? "supplier-error" : undefined}
                  className={`mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 ${
                    supplierError
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-indigo-400 focus:ring-indigo-100"
                  }`}
                />
                <datalist id="known-suppliers">
                  {knownSuppliers.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                {supplierError && (
                  <p id="supplier-error" className="mt-1 text-xs text-red-600">
                    {supplierError}
                  </p>
                )}
              </label>

              <label>
                <div className="text-xs font-semibold text-slate-600">
                  Fecha entrega
                </div>
                <input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitOrder();
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
                          <div className="text-xs font-semibold text-slate-600">
                            Producto
                          </div>
                          <div className="relative mt-1">
                            <div
                              className={`flex items-center gap-2 rounded-md border bg-white px-2 focus-within:ring-2 ${
                                error
                                  ? "border-red-300 focus-within:ring-red-100"
                                  : "border-slate-200 focus-within:border-indigo-400 focus-within:ring-indigo-100"
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
                                placeholder="Nombre o SKU..."
                                value={line.product}
                                onChange={(e) => {
                                  updateLine(idx, {
                                    product: e.target.value,
                                    id: "",
                                    sku: "",
                                    unit_cost: 0,
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
                                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50 ${sidx === activeSuggestionIndex ? "bg-indigo-50" : ""}`}
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
                                          {currency(s.cost_price ?? s.price ?? 0)}
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

                        {/* Cantidad */}
                        <div className="sm:col-span-2">
                          <div className="text-xs font-semibold text-slate-600">
                            Cantidad
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label="Disminuir cantidad"
                              onClick={() => incQty(idx, -1)}
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
                              className="w-16 rounded-md border border-slate-200 px-2 py-1 text-right outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {line.id ? `${line.stock} en stock` : ""}
                          </div>
                        </div>

                        {/* Costo unitario */}
                        <div className="sm:col-span-2">
                          <div className="text-xs font-semibold text-slate-600">
                            Costo unitario
                          </div>
                          <input
                            ref={(el) => {
                              fieldRefs.current[line._key] = {
                                ...fieldRefs.current[line._key],
                                cost: el,
                              };
                            }}
                            type="number"
                            min="0"
                            onKeyDown={(e) => onKeyDownCost(e, idx)}
                            className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-right outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            value={line.unit_cost}
                            onChange={(e) =>
                              updateLine(idx, { unit_cost: Number(e.target.value) })
                            }
                            aria-label={`Costo unitario línea ${idx + 1}`}
                          />
                          <div className="mt-1 text-xs text-slate-400">
                            {line.id
                              ? currency((Number(line.unit_cost) || 0) * (Number(line.quantity) || 0))
                              : ""}
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
                              className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
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

              {/* notes */}
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Notas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones de la orden (opcional)"
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  rows={2}
                />
              </div>

              {/* resumen y acciones */}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-slate-100 px-3 py-2">
                    <div className="text-xs text-slate-500">Artículos</div>
                    <div className="text-lg font-bold tabular-nums text-slate-800">
                      {totalItems}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Costo total</div>
                    <div className="text-2xl font-extrabold tabular-nums text-indigo-700">
                      {currency(totals.totalCost)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row">
                    <button
                      type="submit"
                      disabled={submitting || !hasProducts}
                      className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {submitting ? "Registrando..." : "Registrar orden"}
                    </button>
                    <button
                      type="button"
                      disabled={!hasProducts}
                      onClick={printOrder}
                      className="flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Printer className="h-4 w-4" /> Imprimir
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* small meta panel */}
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-slate-100 p-2">
                <Calendar className="h-5 w-5 text-indigo-700" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Fecha esperada</div>
                <div className="text-sm text-slate-800">
                  {expectedDelivery
                    ? new Date(expectedDelivery).toLocaleDateString("es-CO")
                    : "-"}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">Proveedor</div>
              <div className="text-sm font-medium text-slate-800">
                {supplier || "-"}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Side panel */}
        <aside>
          <div className="sticky top-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Costo total histórico</div>
                  <div className="text-lg font-bold tabular-nums text-slate-800">
                    {currency(totalOrdersAmount)}
                  </div>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                {totalOrdersCount} orden{totalOrdersCount === 1 ? "" : "es"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setLines([makeEmptyLine()]);
                setLineErrors({});
                setSupplier("");
                setSupplierError("");
                setExpectedDelivery("");
                setNotes("");
                pushToast("Formulario limpiado", "info");
              }}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Limpiar orden
            </button>

            <div className="mt-4">
              <RecentOrders />
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
