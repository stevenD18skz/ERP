// SalePageEnhanced.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getProducts, updateProduct } from "@/services/products.service";
import {
  getSales,
  createSaleWithDetails,
  updateSale,
} from "@/services/sales.service";
import { currency, formatMoney } from "@/utils/converts";

import {
  ShoppingCart,
  Search,
  Minus,
  Plus,
  Trash2,
  X,
  Percent,
  DollarSign,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  UserRound,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  Printer,
} from "lucide-react";

/*
  SalePageEnhanced
  - Layout/estilo portado del prototipo de Claude Design: un único buscador
    arriba que agrega productos a un carrito (en vez de una fila por línea),
    descuentos por línea (%/$), métodos de pago (efectivo/tarjeta/
    transferencia/fiado), recibo de éxito y anulación de ventas con
    devolución real de stock.
  - No se implementó el escaneo de código con cámara (mismo criterio que en
    Productos): simularlo habría sido fingir una función que no existe. El
    buscador ya empareja por código de barras si se escribe/pega.
*/

const uid = () => Math.random().toString(36).slice(2, 9);
const QUICK_CASH = [5000, 10000, 20000, 50000];
const METHOD_LABELS = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  fiado: "Fiado",
};

const lineBase = (l) => l.unitPrice * l.quantity;
const lineDiscountAmount = (l) => {
  if (!l.discountType || !l.discountValue) return 0;
  const base = lineBase(l);
  return l.discountType === "pct"
    ? base * (l.discountValue / 100)
    : Math.min(l.discountValue, base);
};
const lineSubtotal = (l) => lineBase(l) - lineDiscountAmount(l);
const lineCost = (l) => l.cost * l.quantity;

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

export default function SalePageEnhanced() {
  // data
  const [allProducts, setAllProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);

  // búsqueda + carrito
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [lines, setLines] = useState([]);
  const [focusTarget, setFocusTarget] = useState(null);

  // descuento por línea
  const [discountEditingKey, setDiscountEditingKey] = useState(null);
  const [discountDraftType, setDiscountDraftType] = useState("pct");
  const [discountDraftValue, setDiscountDraftValue] = useState("");

  // pago
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [clientName, setClientName] = useState("");
  const [saleErrors, setSaleErrors] = useState({});
  const [confirming, setConfirming] = useState(false);

  // recibo / anulación
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [voidConfirmId, setVoidConfirmId] = useState(null);
  const [voiding, setVoiding] = useState(false);

  const { toasts, push, dismiss } = useToasts();

  const searchInputRef = useRef(null);
  const qtyRefs = useRef({});

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
        push("No se pudo cargar datos. Revisa conexión.", "error");
      } finally {
        if (mounted) setLoadingSales(false);
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
          p.stock > 0 &&
          (p.name.toLowerCase().includes(q) ||
            (p.sku || "").toLowerCase().includes(q) ||
            (p.barcode || "").toLowerCase().includes(q)),
      )
      .slice(0, 5);
  }, [searchQuery, allProducts]);

  const totals = useMemo(() => {
    const total = lines.reduce((sum, l) => sum + lineSubtotal(l), 0);
    const cost = lines.reduce((sum, l) => sum + lineCost(l), 0);
    return { total, cost, gain: total - cost };
  }, [lines]);

  const addLineFromProduct = (product) => {
    setLines((prev) => {
      const existingIdx = prev.findIndex(
        (l) => l.productId === product.id && !l.discountType,
      );
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const nextQty = Math.min(existing.quantity + 1, product.stock);
        if (nextQty === existing.quantity) {
          push("Sin más stock disponible", "info");
        }
        const next = prev.slice();
        next[existingIdx] = { ...existing, quantity: nextQty };
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
          unitPrice: Number(product.price ?? 0),
          cost: Number(product.cost_price ?? 0),
          quantity: 1,
          stock: Number(product.stock ?? 0),
          discountType: null,
          discountValue: 0,
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
    setLines((prev) =>
      prev.map((l) => {
        if (l._key !== key) return l;
        let v = parseInt(raw, 10);
        if (Number.isNaN(v)) v = 1;
        v = Math.max(1, Math.min(v, l.stock || v));
        return { ...l, quantity: v };
      }),
    );
  };
  const stepQty = (key, delta) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l._key !== key) return l;
        const next = Math.max(
          1,
          Math.min(l.quantity + delta, l.stock || l.quantity + delta),
        );
        return { ...l, quantity: next };
      }),
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

  const cancelDiscount = () => {
    setDiscountEditingKey(null);
    setDiscountDraftValue("");
  };
  const applyDiscount = () => {
    const value = parseFloat(discountDraftValue);
    if (Number.isNaN(value) || value <= 0) {
      setDiscountEditingKey(null);
      return;
    }
    setLines((prev) =>
      prev.map((l) =>
        l._key === discountEditingKey
          ? { ...l, discountType: discountDraftType, discountValue: value }
          : l,
      ),
    );
    setDiscountEditingKey(null);
    setDiscountDraftValue("");
  };
  const setPayment = (m) => {
    setPaymentMethod(m);
    setSaleErrors({});
  };
  const addQuickCash = (amount) =>
    setReceivedAmount((r) => String((parseFloat(r) || 0) + amount));
  const setExactAmount = () =>
    setReceivedAmount(String(Math.ceil(totals.total)));

  const receivedNum = parseFloat(receivedAmount);
  const vuelto = (Number.isNaN(receivedNum) ? 0 : receivedNum) - totals.total;
  const vueltoInsufficient =
    receivedAmount !== "" &&
    (Number.isNaN(receivedNum) || receivedNum < totals.total);

  const cancelSale = () => {
    setLines([]);
    setSearchQuery("");
    setReceivedAmount("");
    setClientName("");
    setPaymentMethod("efectivo");
    setSaleErrors({});
    push("Venta cancelada", "info");
  };

  const confirmSale = async () => {
    if (confirming) return;
    if (!lines.length) {
      push("Agrega al menos un producto", "error");
      return;
    }
    const errors = {};
    if (paymentMethod === "efectivo") {
      const recibido = parseFloat(receivedAmount);
      if (
        receivedAmount === "" ||
        Number.isNaN(recibido) ||
        recibido < totals.total
      )
        errors.monto = "El monto recibido debe cubrir el total";
    }
    if (paymentMethod === "fiado" && !clientName.trim())
      errors.cliente = "Escribe el nombre del cliente";
    setSaleErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const total = totals.total;
    const recibido =
      paymentMethod === "efectivo" ? Number(receivedAmount) || 0 : total;
    const salePayload = {
      total_amount: Number(total),
      sale_date: new Date().toISOString(),
      gain: Number(totals.gain),
      payment_method: paymentMethod,
      client_name: paymentMethod === "fiado" ? clientName.trim() : null,
      voided: false,
    };
    const productsFormat = lines.map((l) => ({
      product_id: l.productId,
      quantity: l.quantity,
      sale_price: l.unitPrice,
      discount_type: l.discountType,
      discount_value: l.discountValue,
    }));
    const receiptItems = lines.map((l) => ({
      name: l.name,
      quantity: l.quantity,
      subtotal: lineSubtotal(l),
    }));

    setConfirming(true);
    try {
      await createSaleWithDetails(salePayload, productsFormat);

      await Promise.all(
        lines.map((l) => {
          const current = allProducts.find(
            (p) => String(p.id) === String(l.productId),
          );
          const newStock = Math.max(
            0,
            (current?.stock ?? l.stock) - l.quantity,
          );
          return updateProduct(l.productId, { stock: newStock }).catch(
            (err) => console.error("No se pudo sincronizar el stock:", err),
          );
        }),
      );

      const [updatedSales, updatedProducts] = await Promise.all([
        getSales(),
        getProducts(),
      ]);
      setSales(Array.isArray(updatedSales) ? updatedSales : []);
      setAllProducts(Array.isArray(updatedProducts) ? updatedProducts : []);

      setReceiptData({
        total,
        method: paymentMethod,
        cliente: salePayload.client_name,
        vuelto: paymentMethod === "efectivo" ? recibido - total : null,
        items: receiptItems,
      });
      setReceiptOpen(true);

      setLines([]);
      setSearchQuery("");
      setReceivedAmount("");
      setClientName("");
      setPaymentMethod("efectivo");
      setSaleErrors({});
    } catch (err) {
      console.error("Error creating sale:", err);
      push("Error registrando venta. Intenta de nuevo.", "error");
    } finally {
      setConfirming(false);
    }
  };

  const printReceipt = (data) => {
    if (!data) return;
    const rows = data.items
      .map(
        (it) =>
          `<tr><td>${it.name}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${currency(it.subtotal)}</td></tr>`,
      )
      .join("");
    const noteLine =
      data.method === "efectivo"
        ? `<tr><td colspan="2">Vuelto</td><td style="text-align:right">${currency(Math.max(0, data.vuelto || 0))}</td></tr>`
        : data.method === "fiado"
          ? `<tr><td colspan="3">Fiado a nombre de ${data.cliente || "-"}</td></tr>`
          : `<tr><td colspan="3">Pagado con ${METHOD_LABELS[data.method]}</td></tr>`;
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
        <thead><tr><th>Producto</th><th>Cant.</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><td colspan="2">Total</td><td style="text-align:right">${currency(data.total)}</td></tr>
          ${noteLine}
        </tfoot>
      </table>
      <p class="muted" style="margin-top:16px;text-align:center">¡Gracias por su compra!</p>
      </body></html>`;

    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      push("Permite las ventanas emergentes para imprimir el recibo", "error");
      return;
    }
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const requestVoid = (id) => setVoidConfirmId(id);
  const cancelVoidRequest = () => setVoidConfirmId(null);
  const confirmVoidSale = async () => {
    const sale = sales.find((s) => s.id === voidConfirmId);
    if (!sale) {
      setVoidConfirmId(null);
      return;
    }
    setVoiding(true);
    try {
      await updateSale(sale.id, { voided: true });
      await Promise.all(
        sale.products.map((p) => {
          const current = allProducts.find(
            (ap) => String(ap.id) === String(p.product_id),
          );
          if (!current) return Promise.resolve();
          return updateProduct(p.product_id, {
            stock: current.stock + p.quantity,
          }).catch((err) => console.error(err));
        }),
      );
      const [updatedSales, updatedProducts] = await Promise.all([
        getSales(),
        getProducts(),
      ]);
      setSales(Array.isArray(updatedSales) ? updatedSales : []);
      setAllProducts(Array.isArray(updatedProducts) ? updatedProducts : []);
      push("Venta anulada", "info");
    } catch (err) {
      console.error(err);
      push("Error anulando la venta", "error");
    } finally {
      setVoiding(false);
      setVoidConfirmId(null);
    }
  };

  const todaySales = useMemo(
    () =>
      sales.filter(
        (s) =>
          !s.voided &&
          new Date(s.sale_date).toDateString() === new Date().toDateString(),
      ),
    [sales],
  );
  const todayTotal = useMemo(
    () => todaySales.reduce((sum, s) => sum + s.total_amount, 0),
    [todaySales],
  );

  return (
    <div className="min-h-screen bg-slate-50  md:px-8">
      <div className="mx-auto grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* MAIN */}
        <div className="flex flex-col gap-4 lg:col-span-3">


          {/* Buscador */}
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
                placeholder="Buscar producto por nombre, SKU o código..."
                aria-label="Buscar producto"
                role="combobox"
                aria-expanded={suggestions.length > 0}
                className="h-[46px] w-full rounded-lg border border-slate-200 pl-10 pr-3 text-[15px] outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
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
                        className={`flex w-full items-center justify-between gap-2.5 border-b border-slate-100 px-3.5 py-2.5 text-left last:border-0 ${active ? "bg-teal-50" : "bg-white hover:bg-slate-50"}`}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[14.5px] font-bold text-slate-900">
                            {p.name}
                          </div>
                          <div className="truncate text-xs text-slate-400">
                            SKU {p.sku} · {p.stock} disp.
                          </div>
                        </div>
                        <div className="shrink-0 whitespace-nowrap text-[14.5px] font-bold tabular-nums text-teal-700">
                          {currency(p.price)}
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
                <ShoppingCart className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-[16px] font-bold text-slate-900">
                Aún no agregas productos
              </p>
              <p className="text-sm text-slate-500">
                Busca por nombre, SKU o código de barras.
              </p>
            </div>
          )}

          {/* Líneas del carrito */}
          {lines.length > 0 && (
            <div className="rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-100">
              {lines.map((line) => {
                const hasDiscount = !!line.discountType && line.discountValue > 0;
                return (
                  <div
                    key={line._key}
                    className="border-b border-slate-100 p-3 last:border-0"
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="min-w-[140px] flex-1">
                        <div className="text-[18px] font-bold text-slate-900">
                          {line.name}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          SKU {line.sku}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Restar"
                          onClick={() => stepQty(line._key, -1)}
                          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
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
                          className="no-spinner h-[30px] w-12 rounded-md border border-slate-200 text-center text-sm font-bold tabular-nums text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        />
                        <button
                          type="button"
                          aria-label="Sumar"
                          onClick={() => stepQty(line._key, 1)}
                          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="w-[110px] shrink-0 text-right">
                        <div className="text-[15px] font-bold tabular-nums text-slate-900">
                          {currency(lineSubtotal(line))}
                        </div>
                        {hasDiscount && (
                          <div className="text-xs tabular-nums text-slate-400 line-through">
                            {currency(lineBase(line))}
                          </div>
                        )}
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
                    {/* 
                    <div className="mt-2 pl-0.5">
                      {hasDiscount ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          Descuento {discountLabel}
                          <button
                            type="button"
                            aria-label="Quitar descuento"
                            onClick={() => removeDiscount(line._key)}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openDiscount(line._key)}
                          className="text-[12.5px] font-bold text-teal-700 underline hover:text-teal-800"
                        >
                          Agregar descuento
                        </button>
                      )}
                    </div>
                    */}

                    {discountEditingKey === line._key && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-2.5">
                        <div className="flex overflow-hidden rounded-md border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setDiscountDraftType("pct")}
                            className={`flex h-[34px] items-center gap-1 px-3 text-[13px] font-bold ${discountDraftType === "pct" ? "bg-teal-600 text-white" : "bg-white text-slate-700"}`}
                          >
                            <Percent className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountDraftType("amount")}
                            className={`flex h-[34px] items-center gap-1 px-3 text-[13px] font-bold ${discountDraftType === "amount" ? "bg-teal-600 text-white" : "bg-white text-slate-700"}`}
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={discountDraftValue}
                          onChange={(e) => setDiscountDraftValue(e.target.value)}
                          placeholder="0"
                          autoFocus
                          className="h-[34px] w-24 rounded-md border border-slate-200 px-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        />
                        <button
                          type="button"
                          onClick={cancelDiscount}
                          className="h-[34px] rounded-md border border-slate-200 bg-white px-3 text-[13px] font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={applyDiscount}
                          className="h-[34px] rounded-md bg-teal-600 px-3.5 text-[13px] font-bold text-white hover:bg-teal-700"
                        >
                          Aplicar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pago */}
          {lines.length > 0 && (
            <div className="rounded-xl bg-white p-[18px] shadow-sm ring-1 ring-slate-100">
              <div className="mb-4 flex items-baseline justify-between">
                <div className="text-[22px] font-bold text-slate-900">
                  Total a cobrar
                </div>
                <div className="text-[28px] font-extrabold tabular-nums text-slate-900">
                  {currency(totals.total)}
                </div>
              </div>

              <div className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-slate-500">
                Método de pago
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <PaymentMethodButton
                  active={paymentMethod === "efectivo"}
                  onClick={() => setPayment("efectivo")}
                  icon={Banknote}
                  label="Efectivo"
                />
                <PaymentMethodButton
                  active={paymentMethod === "tarjeta"}
                  onClick={() => setPayment("tarjeta")}
                  icon={CreditCard}
                  label="Tarjeta"
                />
                <PaymentMethodButton
                  active={paymentMethod === "transferencia"}
                  onClick={() => setPayment("transferencia")}
                  icon={ArrowLeftRight}
                  label="Transferencia"
                />
                <PaymentMethodButton
                  active={paymentMethod === "fiado"}
                  onClick={() => setPayment("fiado")}
                  icon={UserRound}
                  label="Fiado"
                />
              </div>

              {paymentMethod === "efectivo" && (


                <div className="flex  justify-between">


                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-slate-900">
                      Monto recibido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={receivedAmount ? formatMoney(Number(receivedAmount)) : ""}
                      onChange={(e) => {
                        const numeric = String(e.target.value).replace(/[^\d]/g, "");
                        setReceivedAmount(numeric);
                        if (saleErrors.monto)
                          setSaleErrors((er) => ({ ...er, monto: undefined }));
                      }}
                      placeholder="0"
                      aria-invalid={!!saleErrors.monto}
                      className={`h-12 w-full max-w-[220px] rounded-lg border px-3.5 text-lg font-bold tabular-nums outline-none focus:ring-2 ${saleErrors.monto ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-teal-500 focus:ring-teal-100"}`}
                    />


                    {saleErrors.monto && (
                      <div className="mt-1.5 text-xs font-semibold text-red-600">
                        {saleErrors.monto}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {QUICK_CASH.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => addQuickCash(amount)}
                          className="h-[38px] rounded-full bg-teal-50 px-3.5 text-[13.5px] font-bold text-teal-800 hover:bg-teal-100"
                        >
                          +{formatMoney(amount)}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={setExactAmount}
                        className="h-[38px] rounded-full border-[1.5px] border-teal-600 bg-white px-3.5 text-[13.5px] font-bold text-teal-700 hover:bg-teal-50"
                      >
                        Monto exacto
                      </button>
                    </div>


                  </div>


                  <div
                    className={`mt-4 flex items-center justify-between rounded-lg p-3.5 ${vueltoInsufficient ? "bg-red-50" : "bg-teal-50"}`}
                  >
                    <div
                      className={`flex items-center gap-2 text-sm font-bold mr-4 ${vueltoInsufficient ? "text-red-700" : "text-teal-800"}`}
                    >
                      {vueltoInsufficient && (
                        <AlertTriangle className="h-[17px] w-[17px]" />
                      )}
                      {vueltoInsufficient ? "Falta por cobrar" : "Vuelto"}
                    </div>
                    <div
                      className={`text-xl font-extrabold tabular-nums ${vueltoInsufficient ? "text-red-700" : "text-teal-800"}`}
                    >
                      {currency(
                        vueltoInsufficient
                          ? totals.total - (Number.isNaN(receivedNum) ? 0 : receivedNum)
                          : vuelto,
                      )}
                    </div>
                  </div>


                </div>



              )}

              {(paymentMethod === "tarjeta" ||
                paymentMethod === "transferencia") && (
                  <div className="flex items-center gap-2.5 rounded-lg bg-teal-50 p-3.5 text-sm font-medium text-teal-800">
                    <CheckCircle2 className="h-[18px] w-[18px] shrink-0" />
                    {paymentMethod === "tarjeta"
                      ? "Confirma cuando el pago con tarjeta se acredite en el datáfono."
                      : "Confirma cuando veas la transferencia (Nequi, Daviplata u otra) en tu cuenta."}
                  </div>
                )}

              {paymentMethod === "fiado" && (
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-900">
                    Nombre del cliente <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      if (saleErrors.cliente)
                        setSaleErrors((er) => ({ ...er, cliente: undefined }));
                    }}
                    placeholder="Ej. Don Roberto"
                    aria-invalid={!!saleErrors.cliente}
                    className={`h-[46px] w-full max-w-xs rounded-lg border px-3.5 text-[15px] outline-none focus:ring-2 ${saleErrors.cliente ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-teal-500 focus:ring-teal-100"}`}
                  />
                  {saleErrors.cliente && (
                    <div className="mt-1.5 text-xs font-semibold text-red-600">
                      {saleErrors.cliente}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-[13.5px] font-semibold text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Esta venta quedará pendiente de cobro a nombre del cliente.
                  </div>
                </div>
              )}

              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={cancelSale}
                  disabled={confirming}
                  className="h-[50px] flex-1 rounded-lg border border-slate-200 text-[15px] font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar venta
                </button>
                <button
                  type="button"
                  onClick={confirmSale}
                  disabled={confirming}
                  className="flex h-[50px] flex-[2] items-center justify-center gap-2 rounded-lg bg-teal-600 text-[15px] font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {confirming && <Loader2 className="h-[18px] w-[18px] animate-spin" />}
                  {confirming ? "Registrando..." : "Registrar venta"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-white p-[18px] shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 text-[13px] font-bold uppercase tracking-wide text-slate-500">
              Ventas de hoy
            </div>
            <div className="flex gap-4">
              <div>
                <div className="text-2xl font-extrabold tabular-nums text-slate-900">
                  {currency(todayTotal)}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  Total vendido
                </div>
              </div>
              <div>
                <div className="text-2xl font-extrabold tabular-nums text-teal-600">
                  {todaySales.length}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">Ventas</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-[18px] shadow-sm ring-1 ring-slate-100">
            <div className="mb-3 text-[13px] font-bold uppercase tracking-wide text-slate-500">
              Historial reciente
            </div>
            <div className="flex flex-col gap-2.5">
              {loadingSales ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 p-3">
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                    <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
                  </div>
                ))
              ) : sales.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  Aún no hay ventas registradas.
                </p>
              ) : (
                sales.slice(0, 8).map((sale) => (
                  <div
                    key={sale.id}
                    className={`rounded-lg bg-slate-50 p-3 ${sale.voided ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div
                        className={`text-[14.5px] font-bold tabular-nums text-slate-900 ${sale.voided ? "line-through" : ""}`}
                      >
                        {currency(sale.total_amount)}
                      </div>
                      <div className="shrink-0 whitespace-nowrap text-xs text-slate-400">
                        {new Date(sale.sale_date).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>




                    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1.5">

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11.5px] font-bold text-slate-700">
                          {METHOD_LABELS[sale.payment_method] || sale.payment_method}
                        </span>



                        {sale.client_name && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11.5px] font-bold text-amber-800">
                            {sale.client_name}
                          </span>
                        )}
                      </div>

                      {sale.voided && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11.5px] font-bold text-red-700">
                          Anulada
                        </span>
                      )}

                      {!sale.voided && (
                        <button
                          type="button"
                          onClick={() => requestVoid(sale.id)}
                          className="mt-2 text-[12.5px] font-bold text-red-700 underline hover:text-red-800"
                        >
                          Anular venta
                        </button>
                      )}
                    </div>



                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {voidConfirmId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4"
          onClick={cancelVoidRequest}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-3.5 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="text-lg font-extrabold text-slate-900">
              ¿Anular esta venta?
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              El stock vendido se devolverá al inventario. Esta acción no se
              puede deshacer.
            </p>
            <div className="mt-1 flex gap-2.5">
              <button
                type="button"
                onClick={cancelVoidRequest}
                disabled={voiding}
                className="h-[46px] flex-1 rounded-lg border border-slate-200 text-[14.5px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmVoidSale}
                disabled={voiding}
                className="flex h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 text-[14.5px] font-bold text-white hover:bg-red-700 disabled:opacity-70"
              >
                {voiding && <Loader2 className="h-4 w-4 animate-spin" />}
                Anular venta
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptOpen && receiptData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4">
          <div className="flex w-full max-w-md flex-col items-center gap-3.5 rounded-2xl bg-white p-7 text-center shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
              <CheckCircle2 className="h-7 w-7 text-teal-600" />
            </div>
            <div className="text-lg font-extrabold text-slate-900">
              Venta registrada
            </div>
            <div className="text-[30px] font-extrabold tabular-nums text-slate-900">
              {currency(receiptData.total)}
            </div>
            <div className="text-sm text-slate-500">
              {receiptData.method === "efectivo"
                ? `Vuelto: ${currency(Math.max(0, receiptData.vuelto || 0))}`
                : receiptData.method === "fiado"
                  ? `Fiado a nombre de ${receiptData.cliente}`
                  : `Pagado con ${METHOD_LABELS[receiptData.method]}`}
            </div>
            <div className="mt-1.5 flex w-full gap-2.5">
              <button
                type="button"
                onClick={() => printReceipt(receiptData)}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-[14.5px] font-bold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" /> Imprimir recibo
              </button>
              <button
                type="button"
                onClick={() => {
                  setReceiptOpen(false);
                  setReceiptData(null);
                }}
                className="h-12 flex-1 rounded-lg bg-teal-600 text-[14.5px] font-bold text-white hover:bg-teal-700"
              >
                Nueva venta
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
                : "text-teal-300";
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

function PaymentMethodButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] px-2 text-sm font-bold transition-colors ${active
        ? "border-teal-600 bg-teal-600 text-white"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {label}
    </button>
  );
}
