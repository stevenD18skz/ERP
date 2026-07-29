// OrdersPageEnhanced.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getProducts, updateProduct } from "@/services/products.service";
import {
  getOrders,
  createOrderWithDetails,
  updateOrder,
} from "@/services/orders.service";
import { uid } from "@/utils/id";
import { openPrintWindow } from "@/utils/print";
import { useToasts } from "@/hooks/useToasts";

import ToastStack from "@/components/ui/ToastStack";
import OrderConfirmedModal from "@/components/orders/OrderConfirmedModal";
import OrderHeaderForm from "@/components/orders/OrderHeaderForm";
import OrderLines from "@/components/orders/OrderLines";
import OrderProductSearch from "@/components/orders/OrderProductSearch";
import OrderTotalPanel from "@/components/orders/OrderTotalPanel";
import OrdersSidebar from "@/components/orders/OrdersSidebar";
import StatusConfirmDialog from "@/components/orders/StatusConfirmDialog";
import { buildOrderPrintHTML } from "@/components/orders/ordersUtils";

/*
 OrdersPageEnhanced
 - Layout/estilo portado del prototipo de Claude Design: un único buscador
   que agrega productos a un carrito de pedido (mismo patrón que Ventas),
   autocompletado de proveedor con "repetir último pedido", adjuntar
   factura/comprobante, y sobre todo: estado del pedido (pendiente/recibido/
   cancelado) — al marcar "recibido" el stock de cada producto sube de
   verdad; antes esta conexión entre Pedidos e inventario no existía.
 - Esta página coordina el estado y habla con los servicios; el dibujo vive en
   components/orders.
*/

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

  const [orderConfirmedData, setOrderConfirmedData] = useState(null);

  const [statusConfirm, setStatusConfirm] = useState(null); // {orderId, action}
  const [statusUpdating, setStatusUpdating] = useState(false);

  const { toasts, push, dismiss } = useToasts();

  const searchInputRef = useRef(null);
  const qtyRefs = useRef({});

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

  // El foco se mueve como efecto y no en el mismo handler porque el elemento
  // destino todavía no existe cuando se agrega una línea nueva.
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

  // Se copian las cantidades del pedido anterior pero los costos se leen del
  // catálogo de hoy: el proveedor pudo haber subido precios desde entonces.
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

  const handleQueryChange = (value) => {
    setSearchQuery(value);
    setSuggestionIndex(-1);
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
        l._key === key ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l,
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

  const resetDraft = () => {
    setLines([]);
    setSearchQuery("");
    setSupplierInput("");
    setExpectedDelivery("");
    setNotes("");
    setAttachment(null);
    setOrderErrors({});
  };

  const cancelOrderDraft = () => {
    resetDraft();
    push("Pedido cancelado", "info");
  };

  const confirmOrder = async () => {
    if (confirming) return;
    if (!lines.length) {
      push("Agrega al menos un producto", "error");
      return;
    }
    const errors = {};
    if (!supplierInput.trim())
      errors.supplier = "Escribe el nombre del proveedor";
    if (!expectedDelivery) errors.fecha = "Elige la fecha de entrega esperada";
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

      resetDraft();
    } catch (err) {
      console.error("Error creating order:", err);
      push("Error registrando pedido. Intenta de nuevo.", "error");
    } finally {
      setConfirming(false);
    }
  };

  const printOrder = (data) => {
    if (!data) return;
    if (!openPrintWindow(buildOrderPrintHTML(data))) {
      push("Permite las ventanas emergentes para imprimir el pedido", "error");
    }
  };

  const requestReceive = (id) =>
    setStatusConfirm({ orderId: id, action: "recibir" });
  const requestCancel = (id) =>
    setStatusConfirm({ orderId: id, action: "cancelar" });
  const cancelStatusConfirm = () => setStatusConfirm(null);

  // Marcar "recibido" es el único punto donde Pedidos mueve el inventario:
  // suma al stock actual lo que traía cada línea del pedido.
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

  return (
    <>
      <div className="mx-auto grid min-h-screen grid-cols-1 gap-6 lg:grid-cols-3">
        {/* MAIN */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Registrar pedido
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Compra a un proveedor
            </p>
          </div>

          <OrderHeaderForm
            supplier={supplierInput}
            onSupplierChange={(value) => {
              setSupplierInput(value);
              if (orderErrors.supplier)
                setOrderErrors((er) => ({ ...er, supplier: undefined }));
            }}
            supplierSuggestions={supplierSuggestions}
            onPickSupplier={setSupplierInput}
            showRepeatLast={showRepeatLast}
            lastOrderItemCount={lastMatchingOrder?.products.length ?? 0}
            onRepeatLast={repeatLastOrder}
            expectedDelivery={expectedDelivery}
            onExpectedDeliveryChange={(value) => {
              setExpectedDelivery(value);
              if (orderErrors.fecha)
                setOrderErrors((er) => ({ ...er, fecha: undefined }));
            }}
            notes={notes}
            onNotesChange={setNotes}
            errors={orderErrors}
          />

          <OrderProductSearch
            inputRef={searchInputRef}
            query={searchQuery}
            onQueryChange={handleQueryChange}
            onKeyDown={handleSearchKeyDown}
            suggestions={suggestions}
            suggestionIndex={suggestionIndex}
            onPick={addLineFromProduct}
          />

          <OrderLines
            lines={lines}
            qtyRefs={qtyRefs}
            onQtyChange={changeQty}
            onQtyStep={stepQty}
            onQtyKeyDown={handleQtyKeyDown}
            onRemove={removeLine}
          />

          {lines.length > 0 && (
            <OrderTotalPanel
              total={total}
              attachment={attachment}
              onAttachmentChange={onAttachmentChange}
              onRemoveAttachment={() => setAttachment(null)}
              confirming={confirming}
              onCancel={cancelOrderDraft}
              onConfirm={confirmOrder}
            />
          )}
        </div>

        <OrdersSidebar
          orders={orders}
          loading={loadingOrders}
          onReceive={requestReceive}
          onCancel={requestCancel}
        />
      </div>

      {statusConfirm && (
        <StatusConfirmDialog
          action={statusConfirm.action}
          updating={statusUpdating}
          onClose={cancelStatusConfirm}
          onConfirm={doStatusConfirm}
        />
      )}

      {orderConfirmedData && (
        <OrderConfirmedModal
          data={orderConfirmedData}
          onPrint={printOrder}
          onClose={() => setOrderConfirmedData(null)}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismiss} accent="indigo" />
    </>
  );
}
