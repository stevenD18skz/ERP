// Constantes y cálculos compartidos por la página de Ventas y sus componentes.
//
// Hay dos "formas" de línea de venta y conviene no confundirlas:
//  - línea del carrito (en memoria): { unitPrice, quantity, cost, discountType,
//    discountValue } — es lo que se está cobrando ahora mismo.
//  - línea de una venta ya guardada: { product, quantity, sale_price,
//    discount_type, discount_value } — viene del servicio y usa snake_case.

export const uid = () => Math.random().toString(36).slice(2, 9);

export const QUICK_CASH = [5000, 10000, 20000, 50000];

export const METHOD_LABELS = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  fiado: "Fiado",
};

/* --- líneas del carrito --- */

export const lineBase = (l) => l.unitPrice * l.quantity;

export const lineDiscountAmount = (l) => {
  if (!l.discountType || !l.discountValue) return 0;
  const base = lineBase(l);
  return l.discountType === "pct"
    ? base * (l.discountValue / 100)
    : Math.min(l.discountValue, base);
};

export const lineSubtotal = (l) => lineBase(l) - lineDiscountAmount(l);

export const lineCost = (l) => l.cost * l.quantity;

/* --- líneas de una venta ya registrada --- */

export const saleLineBase = (p) =>
  (Number(p.sale_price) || 0) * (Number(p.quantity) || 0);

export const saleLineTotal = (p) => {
  const base = saleLineBase(p);
  if (!p.discount_type || !p.discount_value) return base;
  return p.discount_type === "pct"
    ? base - base * (Number(p.discount_value) / 100)
    : base - Math.min(Number(p.discount_value), base);
};

// Unidades vendidas en una venta (no líneas: 3 panes son 3 unidades).
export const saleUnitCount = (sale) =>
  (sale.products || []).reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

export const formatSaleTime = (date) =>
  new Date(date).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatSaleDate = (date) =>
  new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Los ids generados por el servicio son `s<timestamp>`; para mostrarlos como
// folio de factura basta con los últimos dígitos.
export const saleFolio = (sale) => `#${String(sale.id).slice(-6)}`;
