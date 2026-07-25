// OrdersPageEnhanced.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getProducts, updateProduct } from "@/services/products.service";
import {
  getOrders,
  createOrderWithDetails,
  updateOrder,
} from "@/services/orders.service";
import { currency } from "@/utils/converts";

import {
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  Printer,
  ImagePlus,
  RotateCcw,
  Truck,
} from "lucide-react";

/*
 OrdersPageEnhanced
 - Layout/estilo portado del prototipo de Claude Design: un único buscador
   que agrega productos a un carrito de pedido (mismo patrón que Ventas),
   autocompletado de proveedor con "repetir último pedido", adjuntar
   factura/comprobante, y sobre todo: estado del pedido (pendiente/recibido/
   cancelado) — al marcar "recibido" el stock de cada producto sube de
   verdad; antes esta conexión entre Pedidos e inventario no existía.
*/

const uid = () => Math.random().toString(36).slice(2, 9);

const STATUS_STYLE = {
  pendiente: { chip: "bg-amber-100 text-amber-800", label: "Pendiente" },
  recibido: { chip: "bg-emerald-100 text-emerald-800", label: "Recibido" },
  cancelado: { chip: "bg-red-100 text-red-700", label: "Cancelado" },
};

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (text, type = "info") => {
    const id = uid();
    setToasts((s) => [...s, { id, text, type }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 4000);
  };
  const dismiss = (id) => setToasts((s) => s.filter((t) => t.id !== id));
  return { toasts, push, dismiss };
}

export default function OrdersPageEnhanced() {
  // data
  const [allProducts, setAllProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // encabezado del pedido
  const [supplierInput, setSupplierInput] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [attachment, setAttachment] = useState(null);

  // búsqueda + carrito
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [lines, setLines] = useState([]);
  const [focusTarget, setFocusTarget] = useState(null);

  const [orderErrors, setOrderErrors] = useState({});
  const [confirming, setConfirming] = useState(false);

  const [orderConfirmedOpen, setOrderConfirmedOpen] = useState(false);
  const [orderConfirmedData, setOrderConfirmedData] = useState(null);

  const [statusConfirm, setStatusConfirm] = useState(null); // {orderId, action}
  const [statusUpdating, setStatusUpdating] = useState(false);

  const { toasts, push, dismiss } = useToasts();

  const searchInputRef = useRef(null);
  const qtyRefs = useRef({});
  const fileInputRef = useRef(null);

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
        push("No se pudo cargar datos. Revisa conexión.", "error");
      } finally {
        if (mounted) setLoadingOrders(false);
      }
    };
    fetchData();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!focusTarget) return;
    if (focusTarget.type === "search") {
      searchInputRef.current?.focus();
    } else if (focusTarget.type === "qty") {
      const el = qtyRefs.current[focusTarget.key];
      el?.focus();
      el?.select?.();
    }
    setFocusTarget(null);
  }, [focusTarget]);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          (p.barcode || "").toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [searchQuery, allProducts]);

  const knownSuppliers = useMemo(
    () => Array.from(new Set(orders.map((o) => o.supplier).filter(Boolean))),
    [orders],
  );
  const supplierSuggestions = useMemo(() => {
    const q = supplierInput.trim().toLowerCase();
    if (!q) return [];
    return knownSuppliers
      .filter((n) => n.toLowerCase().includes(q) && n.toLowerCase() !== q)
      .slice(0, 5);
  }, [supplierInput, knownSuppliers]);

  const lastMatchingOrder = useMemo(() => {
    const q = supplierInput.trim().toLowerCase();
    if (!q) return null;
    const matches = orders
      .filter((o) => o.supplier.toLowerCase() === q)
      .slice()
      .sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
    return matches[0] || null;
  }, [orders, supplierInput]);
  const showRepeatLast = !!lastMatchingOrder && lines.length === 0;

  const repeatLastOrder = () => {
    if (!lastMatchingOrder) return;
    const newLines = lastMatchingOrder.products
      .map((p) => {
        const product = allProducts.find(
          (ap) => String(ap.id) === String(p.product_id),
        );
        if (!product) return null;
        return {
          _key: uid(),
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitCost: Number(product.cost_price ?? 0),
          quantity: p.quantity,
        };
      })
      .filter(Boolean);
    setLines(newLines);
    push("Pedido anterior copiado", "success");
  };

  const addLineFromProduct = (product) => {
    setLines((prev) => {
      const existingIdx = prev.findIndex((l) => l.productId === product.id);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const next = prev.slice();
        next[existingIdx] = { ...existing, quantity: existing.quantity + 1 };
        setFocusTarget({ type: "qty", key: existing._key });
        return next;
      }
      const key = uid();
      setFocusTarget({ type: "qty", key });
      return [
        ...prev,
        {
          _key: key,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitCost: Number(product.cost_price ?? 0),
          quantity: 1,
        },
      ];
    });
    setSearchQuery("");
    setSuggestionIndex(-1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSuggestionIndex((i) =>
        Math.min((i < 0 ? -1 : i) + 1, suggestions.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSuggestionIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!suggestions.length) return;
      const idx = suggestionIndex >= 0 ? suggestionIndex : 0;
      addLineFromProduct(suggestions[idx]);
    } else if (e.key === "Escape") {
      setSearchQuery("");
      setSuggestionIndex(-1);
    }
  };

  const changeQty = (key, raw) => {
    let v = parseInt(raw, 10);
    if (Number.isNaN(v) || v < 1) v = 1;
    setLines((prev) =>
      prev.map((l) => (l._key === key ? { ...l, quantity: v } : l)),
    );
  };
  const stepQty = (key, delta) => {
    setLines((prev) =>
      prev.map((l) =>
        l._key === key
          ? { ...l, quantity: Math.max(1, l.quantity + delta) }
          : l,
      ),
    );
  };
  const handleQtyKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setFocusTarget({ type: "search" });
    }
  };
  const removeLine = (key) => {
    setLines((prev) => prev.filter((l) => l._key !== key));
    delete qtyRefs.current[key];
  };

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0),
    [lines],
  );

  const onAttachmentChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAttachment(reader.result);
    reader.readAsDataURL(file);
  };

  const cancelOrderDraft = () => {
    setLines([]);
    setSearchQuery("");
    setSupplierInput("");
    setExpectedDelivery("");
    setNotes("");
    setAttachment(null);
    setOrderErrors({});
    push("Pedido cancelado", "info");
  };

  const confirmOrder = async () => {
    if (confirming) return;
    if (!lines.length) {
      push("Agrega al menos un producto", "error");
      return;
    }
    const errors = {};
    if (!supplierInput.trim()) errors.supplier = "Escribe el nombre del proveedor";
    if (!expectedDelivery)
      errors.fecha = "Elige la fecha de entrega esperada";
    setOrderErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const orderPayload = {
      total_amount: Number(total),
      order_date: new Date().toISOString(),
      supplier: supplierInput.trim(),
      expected_delivery: expectedDelivery,
      notes: notes || "",
      status: "pendiente",
      attachment: attachment || null,
    };
    const productsFormat = lines.map((l) => ({
      product_id: l.productId,
      quantity: l.quantity,
      unit_cost: l.unitCost,
    }));
    const items = lines.map((l) => ({
      name: l.name,
      quantity: l.quantity,
      subtotal: l.unitCost * l.quantity,
    }));

    setConfirming(true);
    try {
      await createOrderWithDetails(orderPayload, productsFormat);
      const updatedOrders = await getOrders();
      setOrders(Array.isArray(updatedOrders) ? updatedOrders : []);

      setOrderConfirmedData({
        total,
        supplier: orderPayload.supplier,
        expectedDelivery: orderPayload.expected_delivery,
        items,
      });
      setOrderConfirmedOpen(true);

      setLines([]);
      setSearchQuery("");
      setSupplierInput("");
      setExpectedDelivery("");
      setNotes("");
      setAttachment(null);
      setOrderErrors({});
    } catch (err) {
      console.error("Error creating order:", err);
      push("Error registrando pedido. Intenta de nuevo.", "error");
    } finally {
      setConfirming(false);
    }
  };

  const printOrder = (data) => {
    if (!data) return;
    const rows = data.items
      .map(
        (it) =>
          `<tr><td>${it.name}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${currency(it.subtotal)}</td></tr>`,
      )
      .join("");
    const html = `<html><head><meta charset="utf-8"><title>Pedido</title>
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
      <h2>Pedido a proveedor</h2>
      <div class="muted">${new Date().toLocaleString("es-CO")}</div>
      <div class="meta"><strong>Proveedor:</strong> ${data.supplier}</div>
      <div class="meta"><strong>Entrega esperada:</strong> ${new Date(data.expectedDelivery).toLocaleDateString("es-CO")}</div>
      <table>
        <thead><tr><th>Producto</th><th>Cant.</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="2">Total</td><td style="text-align:right">${currency(data.total)}</td></tr></tfoot>
      </table>
      </body></html>`;
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      push("Permite las ventanas emergentes para imprimir el pedido", "error");
      return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const requestReceive = (id) => setStatusConfirm({ orderId: id, action: "recibir" });
  const requestCancel = (id) => setStatusConfirm({ orderId: id, action: "cancelar" });
  const cancelStatusConfirm = () => setStatusConfirm(null);

  const doStatusConfirm = async () => {
    if (!statusConfirm) return;
    const order = orders.find((o) => o.id === statusConfirm.orderId);
    if (!order) {
      setStatusConfirm(null);
      return;
    }
    setStatusUpdating(true);
    try {
      if (statusConfirm.action === "recibir") {
        await updateOrder(order.id, { status: "recibido" });
        await Promise.all(
          order.products.map((p) => {
            const current = allProducts.find(
              (ap) => String(ap.id) === String(p.product_id),
            );
            if (!current) return Promise.resolve();
            return updateProduct(p.product_id, {
              stock: current.stock + p.quantity,
            }).catch((err) => console.error(err));
          }),
        );
        push("Pedido marcado como recibido, stock actualizado", "success");
      } else {
        await updateOrder(order.id, { status: "cancelado" });
        push("Pedido cancelado", "info");
      }
      const [updatedOrders, updatedProducts] = await Promise.all([
        getOrders(),
        getProducts(),
      ]);
      setOrders(Array.isArray(updatedOrders) ? updatedOrders : []);
      setAllProducts(Array.isArray(updatedProducts) ? updatedProducts : []);
    } catch (err) {
      console.error(err);
      push("Error actualizando el pedido", "error");
    } finally {
      setStatusUpdating(false);
      setStatusConfirm(null);
    }
  };

  const historicoTotal = useMemo(
    () =>
      orders
        .filter((o) => o.status !== "cancelado")
        .reduce((sum, o) => sum + o.total_amount, 0),
    [orders],
  );
  const historicoCount = useMemo(
    () => orders.filter((o) => o.status !== "cancelado").length,
    [orders],
  );

  const isOverdue = (o) =>
    o.status === "pendiente" &&
    o.expected_delivery &&
    new Date(o.expected_delivery) < new Date();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
        {/* MAIN */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Registrar pedido
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Compra a un proveedor
            </p>
          </div>

          {/* Proveedor / fecha / notas */}
          <div className="flex flex-col gap-4 rounded-xl bg-white p-[18px] shadow-sm ring-1 ring-slate-100">
            <div className="relative">
              <label className="mb-1.5 block text-sm font-bold text-slate-900">
                Proveedor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={supplierInput}
                onChange={(e) => {
                  setSupplierInput(e.target.value);
                  if (orderErrors.supplier)
                    setOrderErrors((er) => ({ ...er, supplier: undefined }));
                }}
                placeholder="Escribe o elige un proveedor"
                aria-invalid={!!orderErrors.supplier}
                className={`h-[46px] w-full rounded-lg border px-3.5 text-[15px] outline-none focus:ring-2 ${orderErrors.supplier ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"}`}
              />
              {orderErrors.supplier && (
                <div className="mt-1.5 text-xs font-semibold text-red-600">
                  {orderErrors.supplier}
                </div>
              )}
              {supplierSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[74px] z-10 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
                  {supplierSuggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSupplierInput(name);
                      }}
                      className="block w-full border-b border-slate-100 px-3.5 py-2.5 text-left text-[14.5px] font-semibold text-slate-900 last:border-0 hover:bg-slate-50"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
              {showRepeatLast && (
                <button
                  type="button"
                  onClick={repeatLastOrder}
                  className="mt-2.5 flex h-[38px] items-center gap-2 rounded-full bg-indigo-50 px-3.5 text-[13px] font-bold text-indigo-700 hover:bg-indigo-100"
                >
                  <RotateCcw className="h-[15px] w-[15px]" />
                  Repetir último pedido ({lastMatchingOrder.products.length}{" "}
                  productos)
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3.5">
              <div className="min-w-[180px] flex-1">
                <label className="mb-1.5 block text-sm font-bold text-slate-900">
                  Fecha de entrega esperada{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => {
                    setExpectedDelivery(e.target.value);
                    if (orderErrors.fecha)
                      setOrderErrors((er) => ({ ...er, fecha: undefined }));
                  }}
                  aria-invalid={!!orderErrors.fecha}
                  className={`h-[46px] w-full rounded-lg border px-3.5 text-[15px] outline-none focus:ring-2 ${orderErrors.fecha ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"}`}
                />
                {orderErrors.fecha && (
                  <div className="mt-1.5 text-xs font-semibold text-red-600">
                    {orderErrors.fecha}
                  </div>
                )}
              </div>
              <div className="min-w-[220px] flex-[2]">
                <label className="mb-1.5 block text-sm font-bold text-slate-900">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Entregar en la mañana"
                  className="h-[46px] w-full rounded-lg border border-slate-200 px-3.5 text-[15px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>

          {/* Buscador de productos */}
          <div className="relative rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSuggestionIndex(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar producto por nombre o SKU..."
                aria-label="Buscar producto"
                role="combobox"
                aria-expanded={suggestions.length > 0}
                className="h-[46px] w-full rounded-lg border border-slate-200 pl-10 pr-3 text-[15px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              {suggestions.length > 0 && (
                <div
                  role="listbox"
                  className="absolute left-0 right-0 top-[52px] z-10 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
                >
                  {suggestions.map((p, i) => {
                    const active =
                      i === (suggestionIndex >= 0 ? suggestionIndex : 0);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addLineFromProduct(p);
                        }}
                        className={`flex w-full items-center justify-between gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-left last:border-0 ${active ? "bg-indigo-50" : "bg-white hover:bg-slate-50"}`}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[14.5px] font-bold text-slate-900">
                            {p.name}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            SKU {p.sku} · Stock actual: {p.stock}
                          </div>
                        </div>
                        <div className="shrink-0 whitespace-nowrap text-[14.5px] font-bold tabular-nums text-indigo-700">
                          {currency(p.cost_price)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Carrito vacío */}
          {lines.length === 0 && (
            <div className="flex flex-col items-center gap-2.5 rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Truck className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-[16px] font-bold text-slate-900">
                Aún no agregas productos
              </p>
              <p className="text-sm text-slate-500">
                Busca el producto que quieres pedirle al proveedor.
              </p>
            </div>
          )}

          {/* Líneas del pedido */}
          {lines.length > 0 && (
            <div className="rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-100">
              {lines.map((line) => (
                <div
                  key={line._key}
                  className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 p-3 last:border-0"
                >
                  <div className="min-w-[140px] flex-1">
                    <div className="text-[15px] font-bold text-slate-900">
                      {line.name}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      SKU {line.sku} · {currency(line.unitCost)} c/u
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Restar"
                      onClick={() => stepQty(line._key, -1)}
                      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      ref={(el) => (qtyRefs.current[line._key] = el)}
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => changeQty(line._key, e.target.value)}
                      onKeyDown={handleQtyKeyDown}
                      aria-label={`Cantidad de ${line.name}`}
                      className="no-spinner h-[30px] w-14 rounded-md border border-slate-200 text-center text-sm font-bold tabular-nums text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      aria-label="Sumar"
                      onClick={() => stepQty(line._key, 1)}
                      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="w-[110px] shrink-0 text-right text-[15px] font-bold tabular-nums text-slate-900">
                    {currency(line.unitCost * line.quantity)}
                  </div>

                  <button
                    type="button"
                    aria-label={`Quitar ${line.name}`}
                    onClick={() => removeLine(line._key)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-[15px] w-[15px]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Adjunto + confirmar */}
          {lines.length > 0 && (
            <div className="rounded-xl bg-white p-[18px] shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex items-baseline justify-between">
                <div className="text-[16px] font-bold text-slate-900">
                  Costo total del pedido
                </div>
                <div className="text-[28px] font-extrabold tabular-nums text-slate-900">
                  {currency(total)}
                </div>
              </div>

              <div className="mb-[18px] flex items-start gap-3.5">
                <div className="relative h-[88px] w-[88px] shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100"
                  >
                    {attachment ? (
                      <img
                        src={attachment}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex flex-col items-center gap-1 text-slate-400">
                        <ImagePlus className="h-5 w-5" />
                        <span className="text-[10px] font-semibold">
                          Factura
                        </span>
                      </span>
                    )}
                  </button>
                  {attachment && (
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      aria-label="Quitar adjunto"
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
                  onChange={onAttachmentChange}
                  className="hidden"
                />
                <div className="pt-1.5 text-[13px] text-slate-500">
                  <div className="mb-0.5 font-bold text-slate-700">
                    Adjuntar factura o comprobante
                  </div>
                  Toca el recuadro para subir una foto del comprobante que te
                  da el proveedor (opcional).
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={cancelOrderDraft}
                  disabled={confirming}
                  className="h-[50px] flex-1 rounded-lg border border-slate-200 text-[15px] font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmOrder}
                  disabled={confirming}
                  className="flex h-[50px] flex-[2] items-center justify-center gap-2 rounded-lg bg-indigo-600 text-[15px] font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {confirming && (
                    <Loader2 className="h-[18px] w-[18px] animate-spin" />
                  )}
                  {confirming ? "Registrando..." : "Registrar pedido"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-white p-[18px] shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 text-[13px] font-bold uppercase tracking-wide text-slate-500">
              Compras históricas
            </div>
            <div className="flex gap-4">
              <div>
                <div className="text-2xl font-extrabold tabular-nums text-slate-900">
                  {currency(historicoTotal)}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Costo total
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold tabular-nums text-indigo-600">
                  {historicoCount}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">Órdenes</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-[18px] shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 text-[13px] font-bold uppercase tracking-wide text-slate-500">
              Historial de pedidos
            </div>
            <div className="flex flex-col gap-2.5">
              {loadingOrders ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 p-3">
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                    <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                  </div>
                ))
              ) : orders.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  Aún no hay pedidos registrados.
                </p>
              ) : (
                orders.slice(0, 8).map((order) => {
                  const st = STATUS_STYLE[order.status] || STATUS_STYLE.pendiente;
                  const overdue = isOverdue(order);
                  return (
                    <div key={order.id} className="rounded-lg bg-slate-50 p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="truncate text-[14.5px] font-bold text-slate-900">
                          {order.supplier}
                        </div>
                        <div className="shrink-0 text-[14px] font-bold tabular-nums text-slate-900">
                          {currency(order.total_amount)}
                        </div>
                      </div>
                      {order.expected_delivery && (
                        <div className="mt-0.5 text-xs text-slate-400">
                          Entrega esperada:{" "}
                          {new Date(order.expected_delivery).toLocaleDateString(
                            "es-CO",
                          )}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold ${st.chip}`}
                        >
                          {st.label}
                        </span>
                        {overdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11.5px] font-bold text-amber-800">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Entrega atrasada
                          </span>
                        )}
                      </div>
                      {order.status === "pendiente" && (
                        <div className="mt-2.5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => requestReceive(order.id)}
                            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-50 text-[12.5px] font-bold text-emerald-800 hover:bg-emerald-100"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Marcar recibido
                          </button>
                          <button
                            type="button"
                            onClick={() => requestCancel(order.id)}
                            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-red-50 text-[12.5px] font-bold text-red-700 hover:bg-red-100"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmar cambio de estado */}
      {statusConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4"
          onClick={cancelStatusConfirm}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-3.5 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="text-lg font-extrabold text-slate-900">
              {statusConfirm.action === "recibir"
                ? "¿Marcar este pedido como recibido?"
                : "¿Cancelar este pedido?"}
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              {statusConfirm.action === "recibir"
                ? "Se sumará al inventario el stock de cada producto del pedido."
                : "Esta acción no se puede deshacer."}
            </p>
            <div className="mt-1 flex gap-2.5">
              <button
                type="button"
                onClick={cancelStatusConfirm}
                disabled={statusUpdating}
                className="h-[46px] flex-1 rounded-lg border border-slate-200 text-[14.5px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={doStatusConfirm}
                disabled={statusUpdating}
                className={`flex h-[46px] flex-1 items-center justify-center gap-2 rounded-lg text-[14.5px] font-bold text-white disabled:opacity-70 ${
                  statusConfirm.action === "recibir"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {statusUpdating && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {statusConfirm.action === "recibir"
                  ? "Marcar recibido"
                  : "Cancelar pedido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pedido registrado */}
      {orderConfirmedOpen && orderConfirmedData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4">
          <div className="flex w-full max-w-md flex-col items-center gap-3.5 rounded-2xl bg-white p-7 text-center shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
              <CheckCircle2 className="h-7 w-7 text-indigo-600" />
            </div>
            <div className="text-lg font-extrabold text-slate-900">
              Pedido registrado
            </div>
            <div className="text-[30px] font-extrabold tabular-nums text-slate-900">
              {currency(orderConfirmedData.total)}
            </div>
            <div className="text-sm text-slate-500">
              Pedido a {orderConfirmedData.supplier} · entrega esperada{" "}
              {new Date(orderConfirmedData.expectedDelivery).toLocaleDateString(
                "es-CO",
              )}
            </div>
            <div className="mt-1.5 flex w-full gap-2.5">
              <button
                type="button"
                onClick={() => printOrder(orderConfirmedData)}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-[14.5px] font-bold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" /> Imprimir orden
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderConfirmedOpen(false);
                  setOrderConfirmedData(null);
                }}
                className="h-12 flex-1 rounded-lg bg-indigo-600 text-[14.5px] font-bold text-white hover:bg-indigo-700"
              >
                Nuevo pedido
              </button>
            </div>
          </div>
        </div>
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
                : "text-indigo-300";
          return (
            <div
              key={t.id}
              className="flex w-full max-w-md animate-fade-slide-up items-center gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-white shadow-xl"
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 ${iconColor}`} />
              <span className="flex-1 text-sm font-medium">{t.text}</span>
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
