// OrdersPageEnhanced.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "tailwindcss/tailwind.css";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

import {
  Truck,
  Plus,
  Trash2,
  Check,
  Search,
  Calendar,
  FileText,
  Tag,
} from "lucide-react";

/*
 OrdersPageEnhanced
 - UI/UX: flujo guiado como SalesPage, adaptado a órdenes de compra
 - Colores: indigo (distinto a Sales teal)
 - Servicios esperados (pueden pasarse como props):
    services = { getOrders, createOrderWithDetails, getProducts }
 - Si no pasas servicios, el componente intenta leer de window.* para demo
*/

OrdersPageEnhanced.propTypes = {
  services: PropTypes.shape({
    getOrders: PropTypes.func.isRequired,
    createOrderWithDetails: PropTypes.func.isRequired,
    getProducts: PropTypes.func.isRequired,
  }),
};

export default function OrdersPageEnhanced({
  services = {
    getOrders: window.getOrders,
    createOrderWithDetails: window.createOrderWithDetails,
    getProducts: window.getProducts,
  },
}) {
  // data
  const [allProducts, setAllProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // order in progress
  const emptyLine = {
    id: "",
    product: "",
    sku: "",
    quantity: 1,
    unit_cost: 0,
    stock: 0,
  };
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [supplier, setSupplier] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");

  // suggestions + UI
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [focusedLineIndex, setFocusedLineIndex] = useState(null);

  // local toasts
  const [toasts, setToasts] = useState([]);
  const pushToast = (text, type = "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const productInputRefs = useRef([]);

  const currency = (n) =>
    typeof n === "number"
      ? n.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
        })
      : "-";

  // Fetch initial data
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoadingOrders(true);
      try {
        const p = services.getProducts ? await services.getProducts() : [];
        const ord = services.getOrders ? await services.getOrders() : [];
        if (!mounted) return;
        setAllProducts(Array.isArray(p) ? p : []);
        setOrders(Array.isArray(ord) ? ord : []);
      } catch (err) {
        console.error("Error fetching orders/products:", err);
        pushToast("No se pudo cargar datos. Revisa conexión.", "error");
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchData();
    return () => (mounted = false);
  }, [services]);

  // totals: total_cost of order
  const totals = useMemo(() => {
    const totalCost = lines.reduce(
      (acc, l) => acc + (Number(l.unit_cost) || 0) * (Number(l.quantity) || 0),
      0,
    );
    const items = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);
    return { totalCost, items };
  }, [lines]);

  // suggestions logic (same as sales)
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
    setActiveSuggestionIndex(0);
  };

  const onKeyDownProduct = (e, lineIndex) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
        e.preventDefault();
        pickSuggestion(lineIndex, suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  const pickSuggestion = (lineIndex, product) => {
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
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    setTimeout(() => {
      const nextQty = productInputRefs.current?.[lineIndex]?.qty;
      if (nextQty) nextQty.focus();
    }, 40);
  };

  const addLine = (atIndex = null) => {
    setLines((prev) => {
      const next = [...prev];
      if (atIndex === null) next.push({ ...emptyLine });
      else next.splice(atIndex + 1, 0, { ...emptyLine });
      return next;
    });
    setTimeout(() => {
      const idx = atIndex === null ? lines.length : atIndex + 1;
      productInputRefs.current[idx]?.prod?.focus();
    }, 80);
  };

  const removeLine = (index) => {
    if (lines.length === 1) {
      setLines([{ ...emptyLine }]);
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index, changes) => {
    setLines((prev) =>
      prev.map((l, idx) => (idx === index ? { ...l, ...changes } : l)),
    );
  };

  const incQty = (index, delta) => {
    setLines((prev) =>
      prev.map((l, i) =>
        i === index
          ? { ...l, quantity: Math.max(1, (Number(l.quantity) || 0) + delta) }
          : l,
      ),
    );
  };

  // validate order
  const validateOrder = () => {
    if (!supplier) return "Ingresa el proveedor de la orden.";
    if (!lines.length) return "Agrega al menos 1 producto.";
    for (const [i, l] of lines.entries()) {
      if (!l.product) return `Falta producto en la línea ${i + 1}.`;
      if (!Number(l.quantity) || Number(l.quantity) <= 0)
        return `Cantidad inválida en línea ${i + 1}.`;
      if (!Number(l.unit_cost) || Number(l.unit_cost) < 0)
        return `Costo inválido en línea ${i + 1}.`;
    }
    return null;
  };

  // submit order
  const submitOrder = async () => {
    const error = validateOrder();
    if (error) {
      pushToast(error, "error");
      return;
    }

    const confirm = await Swal.fire({
      title: "Confirmar orden",
      html: `<strong>Proveedor:</strong> ${supplier || "-"}<br/><strong>Total:</strong> ${currency(totals.totalCost || 0)}<br/><strong>Items:</strong> ${totals.items}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Registrar orden",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    const orderPayload = {
      total_amount: Number(totals.totalCost || 0),
      order_date: new Date().toISOString(),
      supplier: supplier,
      expected_delivery: expectedDelivery || null,
      notes: notes || "",
    };

    const productsFormat = lines.map((l) => ({
      product_id: Number(l.id) || null,
      quantity: Number(l.quantity) || 0,
      unit_cost: Number(l.unit_cost) || 0,
    }));

    try {
      pushToast("Registrando orden...", "info");
      if (services.createOrderWithDetails) {
        await services.createOrderWithDetails(orderPayload, productsFormat);
      } else {
        // fallback: local list push
        setOrders((o) => [
          {
            products: lines.map((l) => ({
              product: l.product,
              quantity: l.quantity,
              unit_cost: l.unit_cost,
            })),
            total_amount: totals.totalCost,
            order_date: new Date().toISOString(),
            supplier,
          },
          ...o,
        ]);
      }

      Swal.fire({
        icon: "success",
        title: "Orden registrada",
        html: `Total: ${currency(totals.totalCost)}`,
        timer: 2000,
        showConfirmButton: false,
      });

      // reset form
      setSupplier("");
      setExpectedDelivery("");
      setNotes("");
      setLines([{ ...emptyLine }]);
    } catch (err) {
      console.error("Error creating order:", err);
      pushToast("Error registrando orden. Intenta de nuevo.", "error");
    }
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

  const RecentOrders = () => (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          Órdenes recientes
        </h3>
        <div className="text-sm text-slate-500">
          {loadingOrders ? "Cargando..." : `${orders.length} registros`}
        </div>
      </div>

      <div className="space-y-3">
        {loadingOrders ? (
          <div className="py-12 text-center text-slate-500">
            Cargando órdenes...
          </div>
        ) : orders.length === 0 ? (
          <div className="py-6 text-slate-500">No hay órdenes registradas.</div>
        ) : (
          <div className="divide-y rounded-lg bg-white shadow-sm">
            {orders.slice(0, 8).map((o, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 hover:bg-slate-50"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">
                    {o.supplier || "Proveedor desconocido"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {o.products
                      .map((p) => `${p.product} (${p.quantity})`)
                      .join(", ")}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {o.expected_delivery
                      ? `Entrega: ${new Date(o.expected_delivery).toLocaleDateString()}`
                      : ""}
                  </div>
                </div>

                <div className="ml-3 text-right">
                  <div className="text-sm font-bold text-slate-800">
                    {currency(o.total_amount)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(o.order_date).toLocaleString()}
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
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-indigo-600 p-2 text-white">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Registrar orden
                  </h2>
                  <div className="text-xs text-slate-500">
                    Flujo guiado: proveedor → productos → confirmar.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  title="Limpiar"
                  onClick={() => {
                    setLines([{ ...emptyLine }]);
                    setSupplier("");
                    setExpectedDelivery("");
                    setNotes("");
                  }}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <Trash2 className="h-4 w-4" /> Limpiar
                </button>
                <button
                  onClick={() => addLine()}
                  className="flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white"
                >
                  <Plus className="h-4 w-4" /> Añadir línea
                </button>
              </div>
            </div>

            {/* supplier + meta */}
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="md:col-span-2">
                <div className="text-xs font-semibold text-slate-600">
                  Proveedor
                </div>
                <input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Nombre del proveedor"
                  className="mt-1 w-full rounded-md border px-3 py-2"
                />
              </label>

              <label>
                <div className="text-xs font-semibold text-slate-600">
                  Fecha entrega
                </div>
                <div className="mt-1">
                  <input
                    type="date"
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>
              </label>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitOrder();
              }}
              className="space-y-4"
            >
              {lines.map((line, idx) => (
                <motion.div
                  key={idx}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative rounded-md border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex w-12 flex-shrink-0 items-center justify-center">
                      <div className="text-xs text-slate-500">{idx + 1}</div>
                    </div>

                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-12">
                      {/* Product */}
                      <div className="sm:col-span-6">
                        <div className="text-xs font-semibold text-slate-600">
                          Producto
                        </div>
                        <div className="relative mt-1">
                          <div className="flex items-center gap-2 rounded-md border bg-white px-2 py-1">
                            <Search className="h-4 w-4 text-slate-300" />
                            <input
                              ref={(el) => {
                                productInputRefs.current[idx] = {
                                  ...productInputRefs.current[idx],
                                  prod: el,
                                  qty: productInputRefs.current[idx]?.qty,
                                };
                              }}
                              type="text"
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
                                updateSuggestions(line.product, idx);
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
                            <div className="px-2 text-xs text-slate-400">
                              {line.sku}
                            </div>
                          </div>

                          {/* suggestions */}
                          {focusedLineIndex === idx &&
                            suggestions.length > 0 && (
                              <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-auto rounded-md border bg-white shadow-lg">
                                {suggestions.map((s, sidx) => (
                                  <button
                                    key={s.id || sidx}
                                    onMouseDown={(ev) => {
                                      ev.preventDefault();
                                      pickSuggestion(idx, s);
                                    }}
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50 ${sidx === activeSuggestionIndex ? "bg-indigo-50" : ""}`}
                                  >
                                    <div>
                                      <div className="font-medium text-slate-800">
                                        {s.name}
                                      </div>
                                      <div className="text-xs text-slate-400">
                                        {s.category || ""} • {s.sku || ""}
                                      </div>
                                    </div>
                                    <div className="text-right text-sm text-slate-600">
                                      <div>
                                        {currency(
                                          s.cost_price ??
                                            s.unit_cost ??
                                            s.price ??
                                            0,
                                        )}
                                      </div>
                                      <div
                                        className={`text-xs ${s.stock <= 5 ? "text-red-600" : "text-slate-500"}`}
                                      >
                                        {s.stock} en stock
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <div className="text-xs font-semibold text-slate-600">
                          Cantidad
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => incQty(idx, -1)}
                            className="rounded-md border px-2 py-1 text-slate-600"
                          >
                            −
                          </button>
                          <input
                            ref={(el) =>
                              (productInputRefs.current[idx] = {
                                ...productInputRefs.current[idx],
                                qty: el,
                              })
                            }
                            type="number"
                            min="1"
                            className="w-20 rounded-md border px-2 py-1 text-right"
                            value={line.quantity}
                            onChange={(e) =>
                              updateLine(idx, {
                                quantity: Math.max(1, Number(e.target.value)),
                              })
                            }
                          />
                          <button
                            type="button"
                            onClick={() => incQty(idx, 1)}
                            className="rounded-md border px-2 py-1 text-slate-600"
                          >
                            +
                          </button>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {line.stock ? `${line.stock} disponibles` : ""}
                        </div>
                      </div>

                      {/* Unit cost */}
                      <div className="sm:col-span-2">
                        <div className="text-xs font-semibold text-slate-600">
                          Costo unitario
                        </div>
                        <div className="mt-1">
                          <input
                            type="number"
                            className="w-full rounded-md border px-2 py-1 text-right"
                            value={line.unit_cost}
                            onChange={(e) =>
                              updateLine(idx, {
                                unit_cost: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Costo estimado
                        </div>
                      </div>

                      {/* actions */}
                      <div className="mt-2 flex justify-end sm:col-span-12">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="Agregar debajo"
                            onClick={() => addLine(idx)}
                            className="rounded-md border px-2 py-1 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Eliminar línea"
                            onClick={() => removeLine(idx)}
                            className="rounded-md border px-2 py-1 text-sm text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* notes + actions */}
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Notas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones de la orden (opcional)"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-md bg-slate-100 p-3">
                    <div className="text-xs text-slate-500">Artículos</div>
                    <div className="text-lg font-bold text-slate-800">
                      {totalItems}
                    </div>
                  </div>

                  <div className="rounded-md bg-slate-100 p-3">
                    <div className="text-xs text-slate-500">Costo estimado</div>
                    <div className="text-lg font-bold text-slate-800">
                      {currency(totals.totalCost)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="text-2xl font-extrabold text-indigo-700">
                      {currency(totals.totalCost)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row">
                    <button
                      type="button"
                      onClick={() => submitOrder()}
                      className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white"
                    >
                      <Check className="h-4 w-4" /> Registrar orden
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        Swal.fire({
                          title: "Imprimir orden",
                          text: "Se abrirá una vista de impresión con los detalles de la orden.",
                          icon: "info",
                          showCancelButton: true,
                          confirmButtonText: "Imprimir",
                          cancelButtonText: "Cancelar",
                        }).then((r) => {
                          if (r.isConfirmed) window.print();
                        });
                      }}
                      className="flex items-center gap-2 rounded-md border px-4 py-2"
                    >
                      <FileText className="h-4 w-4" /> Imprimir
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* small meta panel */}
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-slate-100 p-2">
                <Calendar className="h-5 w-5 text-indigo-700" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Fecha esperada</div>
                <div className="text-sm text-slate-800">
                  {expectedDelivery
                    ? new Date(expectedDelivery).toLocaleDateString()
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
          <div className="sticky top-6 rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-slate-100 p-2 text-slate-700">
                  <Tag className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Resumen rápido</div>
                  <div className="text-lg font-bold text-slate-800">
                    {currency(totals.totalCost)}
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-500">Hoy</div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <div>Artículos</div>
                <div className="font-medium text-slate-800">{totalItems}</div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <div>Proveedores</div>
                <div className="font-medium text-slate-800">
                  {/* could be dynamic */}—
                </div>
              </div>

              <div>
                <button
                  onClick={() => {
                    setLines([{ ...emptyLine }]);
                    setSupplier("");
                    setExpectedDelivery("");
                    setNotes("");
                    pushToast("Formulario limpiado", "info");
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  Limpiar orden
                </button>
              </div>
            </div>

            <div className="mt-4">
              <RecentOrders />
            </div>
          </div>
        </aside>
      </div>

      {/* Toaster */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-md px-4 py-2 shadow ${t.type === "error" ? "bg-red-100 text-red-700" : t.type === "success" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}
          >
            {t.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
