// Constantes y cálculos de Pedidos.

import { currency } from "@/utils/converts";

export const STATUS_STYLE = {
  pendiente: { chip: "bg-amber-100 text-amber-800", label: "Pendiente" },
  recibido: { chip: "bg-emerald-100 text-emerald-800", label: "Recibido" },
  cancelado: { chip: "bg-red-100 text-red-700", label: "Cancelado" },
};

// Un pedido está atrasado cuando sigue pendiente y su fecha de entrega ya pasó.
// Un pedido recibido o cancelado nunca se marca así, aunque la fecha haya
// quedado atrás: ya se resolvió.
export const isOverdue = (o) =>
  o.status === "pendiente" &&
  o.expected_delivery &&
  new Date(o.expected_delivery) < new Date();

export const formatDeliveryDate = (value) =>
  new Date(value).toLocaleDateString("es-CO");

// Orden impresa para llevarle al proveedor.
export const buildOrderPrintHTML = (data) => {
  const rows = data.items
    .map(
      (it) =>
        `<tr><td>${it.name}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:right">${currency(it.subtotal)}</td></tr>`,
    )
    .join("");
  return `<html><head><meta charset="utf-8"><title>Pedido</title>
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
      <div class="meta"><strong>Entrega esperada:</strong> ${formatDeliveryDate(data.expectedDelivery)}</div>
      <table>
        <thead><tr><th>Producto</th><th>Cant.</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="2">Total</td><td style="text-align:right">${currency(data.total)}</td></tr></tfoot>
      </table>
      </body></html>`;
};
