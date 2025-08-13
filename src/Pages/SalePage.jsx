// SalePageEnhanced.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "tailwindcss/tailwind.css";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  DollarSign,
  Search,
  CreditCard,
  Tag,
} from "lucide-react";

/*
  SalePageEnhanced
  - UX-focused: pasos claros, validaciones, feedback, keyboard-friendly suggestions
  - Usa servicios: getSales(), createSaleWithDetails(), getProducts() (los tuyos)
  - Si quieres puedo adaptarlo a un "services" prop como en ProductsPage
*/

SalePageEnhanced.propTypes = {
  services: PropTypes.shape({
    getSales: PropTypes.func.isRequired,
    createSaleWithDetails: PropTypes.func.isRequired,
    getProducts: PropTypes.func.isRequired,
  }),
};

export default function SalePageEnhanced({
  // si quieres pasar servicios como props, se respeta:
  services = {
    getSales: window.getSales, // intenta usar global si existen
    createSaleWithDetails: window.createSaleWithDetails,
    getProducts: window.getProducts,
  },
}) {
  // data
  const [allProducts, setAllProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);

  // venta en curso
  const emptyLine = {
    id: "",
    product: "",
    sku: "",
    quantity: 1,
    price: 0,
    sale_price: 0,
    stock: 0,
  };
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [receivedAmount, setReceivedAmount] = useState(0);

  // suggestions + UI
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [focusedLineIndex, setFocusedLineIndex] = useState(null);

  // small toasts (local)
  const [toasts, setToasts] = useState([]);
  const pushToast = (text, type = "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const productInputRefs = useRef([]);

  // Formatted helpers
  const fmt = (n) =>
    typeof n === "number"
      ? n.toLocaleString("es-CO", { minimumFractionDigits: 0 })
      : n;

  const currency = (n) =>
    typeof n === "number"
      ? n.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
        })
      : "-";

  // FETCH initial data
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoadingSales(true);
      try {
        const p = services.getProducts ? await services.getProducts() : [];
        const s = services.getSales ? await services.getSales() : [];
        if (!mounted) return;
        setAllProducts(Array.isArray(p) ? p : []);
        setSales(Array.isArray(s) ? s : []);
      } catch (err) {
        console.error("Error fetching sales/products:", err);
        pushToast("No se pudo cargar datos. Revisa conexión.", "error");
      } finally {
        setLoadingSales(false);
      }
    };
    fetchData();
    return () => (mounted = false);
  }, [services]);

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
    setActiveSuggestionIndex(0);
  };

  // keyboard navigation for suggestions
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
              sale_price: Number(product.sale_price ?? product.price ?? 0),
              price: Number(product.price ?? 0),
              stock: Number(product.stock ?? 0),
            }
          : l,
      ),
    );
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
    // focus quantity next
    setTimeout(() => {
      const nextQty = productInputRefs.current?.[lineIndex]?.qty;
      if (nextQty) nextQty.focus();
    }, 40);
  };

  // Add / remove lines
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
      // clear instead of removing last
      setLines([{ ...emptyLine }]);
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  // update a field
  const updateLine = (index, changes) => {
    setLines((prev) =>
      prev.map((l, idx) => (idx === index ? { ...l, ...changes } : l)),
    );
  };

  // Quick increment/decrement for quantity
  const incQty = (index, delta) => {
    setLines((prev) =>
      prev.map((l, i) =>
        i === index
          ? { ...l, quantity: Math.max(1, (Number(l.quantity) || 0) + delta) }
          : l,
      ),
    );
  };

  // Validate before submit
  const validateSale = () => {
    if (!lines.length) return "Agrega al menos 1 producto.";
    for (const [i, l] of lines.entries()) {
      if (!l.product) return `Falta producto en la línea ${i + 1}.`;
      if (!Number(l.quantity) || Number(l.quantity) <= 0)
        return `Cantidad inválida en línea ${i + 1}.`;
      if (!Number(l.sale_price) || Number(l.sale_price) < 0)
        return `Precio inválido en línea ${i + 1}.`;
      if (l.stock && Number(l.quantity) > Number(l.stock))
        return `Stock insuficiente para ${l.product} (línea ${i + 1}).`;
    }
    return null;
  };

  // Submit sale (with confirmation)
  const submitSale = async () => {
    const error = validateSale();
    if (error) {
      pushToast(error, "error");
      return;
    }

    const total = totals.total;
    // if received is less than total, warn
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

    // confirm final
    const confirm = await Swal.fire({
      title: "Confirmar venta",
      html: `<strong>Total:</strong> ${currency(total)}<br/><strong>Recibido:</strong> ${currency(receivedAmount)}<br/><strong>Vuelto:</strong> ${currency(totals.change)}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Registrar venta",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    // prepare payload
    const salePayload = {
      total_amount: Number(total),
      sale_date: new Date().toISOString(),
      gain: Number(totals.gain),
    };
    const productsFormat = lines.map((l) => ({
      product_id: Number(l.id) || null,
      quantity: Number(l.quantity) || 0,
      sale_price: Number(l.sale_price) || 0,
    }));

    try {
      // optimistic feedback
      pushToast("Registrando venta...", "info");
      if (services.createSaleWithDetails) {
        await services.createSaleWithDetails(salePayload, productsFormat);
      } else {
        // fallback: push to local list for demo
        setSales((s) => [
          {
            products: lines.map((l) => ({
              product: l.product,
              quantity: l.quantity,
              sale_price: l.sale_price,
            })),
            total_amount: totals.total,
            gain: totals.gain,
            sale_date: new Date().toISOString(),
          },
          ...s,
        ]);
      }

      // success UI
      Swal.fire({
        icon: "success",
        title: "Venta registrada",
        html: `Total: ${currency(total)}<br/>Vuelto: ${currency(totals.change)}`,
        timer: 2200,
        showConfirmButton: false,
      });

      // reset
      setLines([{ ...emptyLine }]);
      setReceivedAmount(0);
    } catch (err) {
      console.error("Error creating sale:", err);
      pushToast("Error registrando venta. Intenta de nuevo.", "error");
    }
  };

  // suggestion watcher (when product input changes)
  useEffect(() => {
    // maintain keyboard selection visibility
    setActiveSuggestionIndex((i) =>
      i >= suggestions.length ? suggestions.length - 1 : i,
    );
  }, [suggestions]);

  // friendly helpers
  const totalItems = lines.reduce(
    (acc, l) => acc + (Number(l.quantity) || 0),
    0,
  );

  // small UI render helpers for product list preview
  const RecentSales = () => (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          Historial de ventas
        </h3>
        <div className="text-sm text-slate-500">
          {loadingSales ? "Cargando..." : `${sales.length} registros`}
        </div>
      </div>

      <div className="space-y-3">
        {loadingSales ? (
          <div className="py-12 text-center text-slate-500">
            Cargando ventas...
          </div>
        ) : sales.length === 0 ? (
          <div className="py-6 text-slate-500">No hay ventas registradas.</div>
        ) : (
          <div className="divide-y rounded-lg bg-white shadow-sm">
            {sales.slice(0, 8).map((s, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 hover:bg-slate-50"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">
                    {s.products
                      .map((p) => `${p.product} (${p.quantity})`)
                      .join(", ")}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {new Date(s.sale_date).toLocaleString("es-ES", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>

                <div className="ml-3 text-right">
                  <div className="text-sm font-bold text-slate-800">
                    {currency(s.total_amount)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Ganancia {currency(s.gain)}
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
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-teal-600 p-2 text-white">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Registrar venta
                  </h2>
                  <div className="text-xs text-slate-500">
                    Flujo guiado: añade productos, cantidad y confirma.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  title="Limpiar"
                  onClick={() => {
                    setLines([{ ...emptyLine }]);
                    setReceivedAmount(0);
                  }}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <Trash2 className="h-4 w-4" /> Limpiar
                </button>
                <button
                  onClick={() => addLine()}
                  className="flex items-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-sm text-white"
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
                      {/* Producto input (col 1-6) */}
                      <div className="sm:col-span-6">
                        <label className="text-xs font-semibold text-slate-600">
                          Producto
                        </label>
                        <div className="relative">
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

                          {/* suggestions dropdown */}
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
                                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-teal-50 ${sidx === activeSuggestionIndex ? "bg-teal-50" : ""}`}
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
                                        {currency(s.sale_price ?? s.price ?? 0)}
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

                      {/* Cantidad (col 7-8) */}
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-600">
                          Cantidad
                        </label>
                        <div className="flex items-center gap-2">
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

                      {/* Precio Venta (col 9) */}
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-600">
                          Precio
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="w-full rounded-md border px-2 py-1 text-right"
                            value={line.sale_price}
                            onChange={(e) =>
                              updateLine(idx, {
                                sale_price: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Costo: {line.price ? currency(line.price) : "-"}
                        </div>
                      </div>

                      {/* acciones (col 12) */}
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

              {/* resumen y acciones */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-md bg-slate-100 p-3">
                    <div className="text-xs text-slate-500">Items</div>
                    <div className="text-lg font-bold text-slate-800">
                      {totalItems}
                    </div>
                  </div>

                  <div className="rounded-md bg-slate-100 p-3">
                    <div className="text-xs text-slate-500">
                      Ganancia estimada
                    </div>
                    <div className="text-lg font-bold text-slate-800">
                      {currency(totals.gain)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="text-2xl font-extrabold text-teal-700">
                      {currency(totals.total)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:flex-row">
                    <button
                      type="button"
                      onClick={() => submitSale()}
                      className="flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 font-semibold text-white"
                    >
                      <Check className="h-4 w-4" /> Registrar venta
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        Swal.fire({
                          title: "Imprimir recibo",
                          text: "Se abrirá una vista de impresión con los detalles de la venta actual.",
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
                      <CreditCard className="h-4 w-4" /> Recibo
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Recibo rápido / recibido */}
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-slate-100 p-2">
                <DollarSign className="h-5 w-5 text-teal-700" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Monto recibido</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={receivedAmount ? fmt(receivedAmount) : ""}
                    onChange={(e) => {
                      const numeric =
                        Number(String(e.target.value).replace(/[^\d]/g, "")) ||
                        0;
                      setReceivedAmount(numeric);
                    }}
                    className="w-40 rounded-md border px-3 py-2 text-right font-semibold text-teal-800"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">Vuelto estimado</div>
              <div
                className={`text-lg font-bold ${totals.change < 0 ? "text-red-600" : "text-teal-700"}`}
              >
                {currency(totals.change)}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Side panel - resumen + historial */}
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
                    {currency(totals.total)}
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
                <div>Ganancia</div>
                <div className="font-medium text-teal-700">
                  {currency(totals.gain)}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <div>Costo estimado</div>
                <div className="font-medium text-slate-800">
                  {currency(totals.cost)}
                </div>
              </div>

              <div>
                <button
                  onClick={() => {
                    setLines([{ ...emptyLine }]);
                    setReceivedAmount(0);
                    pushToast("Venta limpiada", "info");
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  Limpiar venta
                </button>
              </div>
            </div>

            <div className="mt-4">
              <RecentSales />
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
