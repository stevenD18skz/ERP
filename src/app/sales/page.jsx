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
import DailyCloseMode from "@/components/sales/DailyCloseMode";
import SalesHistoryMode from "@/components/sales/SalesHistoryMode";
import ModeSwitcher from "@/components/sales/ModeSwitcher";
import ProductSearchBar from "@/components/sales/ProductSearchBar";
import CartLines from "@/components/sales/CartLines";
import RecentSales from "@/components/sales/RecentSales";
import ToastStack from "@/components/sales/ToastStack";
import {
  METHOD_LABELS,
  QUICK_CASH,
  lineCost,
  lineSubtotal,
  uid,
} from "@/components/sales/salesUtils";
import MoneyInput from "@/components/ui/MoneyInput";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useToasts } from "@/hooks/useToasts";

import {
  Banknote,
  CreditCard,
  ArrowLeftRight,
  UserRound,
  AlertTriangle,
  CheckCircle2,
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
    Productos): simularlo habría sido fingir una función que no existe. Sí
    hay soporte para lectores que funcionan como teclado (apps como Barcode
    to PC, o un lector USB físico): ver useBarcodeScanner más abajo. El
    buscador de todas formas empareja por código de barras si se escribe o
    se pega a mano.
  - Esta página coordina el estado; el dibujo vive en los componentes de
    components/sales y los cálculos compartidos en salesUtils.
*/

export default function SalePageEnhanced() {
  // modo de captura: "transaccion" registra venta por venta con carrito;
  // "cierre" anota un único total al final del día, como se llevaba en el
  // Excel; "historial" sólo consulta lo ya registrado.
  const [mode, setMode] = useState("transaccion");

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
          p.name.toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          (p.barcode || "").toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [searchQuery, allProducts]);

  const totals = useMemo(() => {
    const total = lines.reduce((sum, l) => sum + lineSubtotal(l), 0);
    const cost = lines.reduce((sum, l) => sum + lineCost(l), 0);
    return { total, cost, gain: total - cost };
  }, [lines]);

  // Devuelve true si el producto quedó agregado (o su cantidad aumentó), y
  // false si no había stock. El llamador decide qué feedback extra dar: el
  // buscador manual no necesita nada más, pero el escáner de código sí
  // avisa cada resultado porque quien escanea no está mirando el carrito.
  //
  // focusQty controla a dónde va el foco después de agregar. Por defecto va
  // al campo de cantidad, para que el buscador manual permita editarla al
  // toque. El escaneo por código de barras pasa focusQty=false: si el foco
  // quedara en el input de cantidad (con su contenido seleccionado), el
  // siguiente escaneo del mismo producto escribiría sus dígitos ahí encima
  // -reemplazando la cantidad por el código de barras- antes de que
  // useBarcodeScanner llegue a procesar el Enter, y el valor gigante
  // resultante terminaba recortado al stock máximo. Ver useBarcodeScanner.ts.
  const addLineFromProduct = (product, { focusQty = true } = {}) => {
    if (!product.stock || product.stock <= 0) {
      push("Sin stock disponible para agregar", "error");
      return false;
    }
    let added = true;
    setLines((prev) => {
      const existingIdx = prev.findIndex(
        (l) => l.productId === product.id && !l.discountType,
      );
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const nextQty = Math.min(existing.quantity + 1, product.stock);
        if (nextQty === existing.quantity) {
          push("Sin más stock disponible", "info");
          added = false;
        }
        const next = prev.slice();
        next[existingIdx] = { ...existing, quantity: nextQty };
        if (focusQty) setFocusTarget({ type: "qty", key: existing._key });
        else setFocusTarget({ type: "search" });
        return next;
      }
      const key = uid();
      if (focusQty) setFocusTarget({ type: "qty", key });
      else setFocusTarget({ type: "search" });
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
    return added;
  };

  // Callback del lector de código de barras (celular con Barcode to PC, o un
  // lector USB el día de mañana: al hook le da igual). Busca coincidencia
  // exacta por código de barras y avisa siempre el resultado, porque quien
  // escanea suele estar mirando la mercancía, no la pantalla.
  const handleBarcodeScan = (code) => {
    const match = allProducts.find(
      (p) => (p.barcode || "").trim() === code.trim(),
    );
    if (!match) {
      push(`Ningún producto tiene el código ${code}`, "error");
      return;
    }
    if (addLineFromProduct(match, { focusQty: false })) {
      push(`${match.name} agregado por código de barras`, "success");
    }
  };

  const { scanning: barcodeScanning } = useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: mode === "transaccion" && !receiptOpen && !voidConfirmId,
  });

  const handleSearchKeyDown = (e) => {
    // useBarcodeScanner ya resolvió este Enter (llegó a document en fase de
    // captura, antes que a este input) y canceló el evento con
    // preventDefault(). Si se sigue de largo aquí, el buscador agregaría el
    // producto otra vez por su cuenta, ahora por coincidencia difusa en vez
    // de por el código exacto.
    if (e.defaultPrevented) return;
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

  const handleQueryChange = (value) => {
    setSearchQuery(value);
    setSuggestionIndex(-1);
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

  // El botón que abre el editor sigue comentado dentro de CartLines; el estado
  // se conserva completo para reactivarlo sin volver a armarlo.
  const discountProps = {
    editingKey: discountEditingKey,
    draftType: discountDraftType,
    onDraftTypeChange: setDiscountDraftType,
    draftValue: discountDraftValue,
    onDraftValueChange: setDiscountDraftValue,
    onCancel: cancelDiscount,
    onApply: applyDiscount,
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
    <>
      <ModeSwitcher mode={mode} onChange={setMode} />

      {mode === "cierre" ? (
        <DailyCloseMode onNotify={push} />
      ) : mode === "historial" ? (
        <SalesHistoryMode
          sales={sales}
          loading={loadingSales}
          onVoid={requestVoid}
        />
      ) : (
      <div className="mx-auto grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* MAIN */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <ProductSearchBar
            inputRef={searchInputRef}
            query={searchQuery}
            onQueryChange={handleQueryChange}
            onKeyDown={handleSearchKeyDown}
            suggestions={suggestions}
            suggestionIndex={suggestionIndex}
            onPick={addLineFromProduct}
            scanning={barcodeScanning}
          />

          <CartLines
            lines={lines}
            qtyRefs={qtyRefs}
            onQtyChange={changeQty}
            onQtyStep={stepQty}
            onQtyKeyDown={handleQtyKeyDown}
            onRemove={removeLine}
            discount={discountProps}
          />

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
                    <MoneyInput
                      value={receivedAmount}
                      onChange={(numeric) => {
                        setReceivedAmount(numeric);
                        if (saleErrors.monto)
                          setSaleErrors((er) => ({ ...er, monto: undefined }));
                      }}
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

          <RecentSales
            sales={sales}
            loading={loadingSales}
            onVoid={requestVoid}
            onSeeAll={() => setMode("historial")}
          />
        </div>
      </div>
      )}

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

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </>
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
