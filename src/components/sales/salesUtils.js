// Constantes y cálculos compartidos por la página de Ventas y sus componentes.
//
// Hay dos "formas" de línea de venta y conviene no confundirlas:
//  - línea del carrito (en memoria): { unitPrice, quantity, cost, discountType,
//    discountValue } — es lo que se está cobrando ahora mismo.
//  - línea de una venta ya guardada: { product, quantity, sale_price,
//    discount_type, discount_value } — viene del servicio y usa snake_case.

import { currency } from "@/utils/converts";

export { uid } from "@/utils/id";

export const QUICK_CASH = [2000, 5000, 10000, 20000, 50000];

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

/* --- recibo impreso --- */

// Sale a 300px de ancho porque está pensado para una impresora térmica de
// tirilla, no para una hoja carta.
export const buildReceiptHTML = (data) => {
  const rows = data.items
    .map(
      (it) =>
        `<tr><td>${it.name}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${currency(it.subtotal)}</td></tr>`,
    )
    .join("");

  // La última línea depende de cómo se pagó: en efectivo importa el vuelto, en
  // fiado a nombre de quién quedó, y en tarjeta o transferencia basta con
  // dejar constancia del medio.
  const noteLine =
    data.method === "efectivo"
      ? `<tr><td colspan="2">Vuelto</td><td style="text-align:right">${currency(Math.max(0, data.vuelto || 0))}</td></tr>`
      : data.method === "fiado"
        ? `<tr><td colspan="3">Fiado a nombre de ${data.cliente || "-"}</td></tr>`
        : `<tr><td colspan="3">Pagado con ${METHOD_LABELS[data.method]}</td></tr>`;

  return `<html><head><meta charset="utf-8"><title>Recibo</title>
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
};
