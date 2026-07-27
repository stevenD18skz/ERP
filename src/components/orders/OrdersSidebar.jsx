"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { currency } from "@/utils/converts";
import { STATUS_STYLE, formatDeliveryDate, isOverdue } from "./ordersUtils";

// Columna derecha: cuánto se ha comprado en total y el historial reciente.
// Los pedidos cancelados no suman al histórico —no se compró nada— pero sí
// siguen apareciendo en la lista, para no perder de vista que existieron.
export default function OrdersSidebar({
  orders,
  loading,
  onReceive,
  onCancel,
}) {
  const historicoTotal = orders
    .filter((o) => o.status !== "cancelado")
    .reduce((sum, o) => sum + o.total_amount, 0);
  const historicoCount = orders.filter((o) => o.status !== "cancelado").length;

  return (
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
            <div className="mt-0.5 text-xs text-slate-400">Costo total</div>
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
          {loading ? (
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
                      {formatDeliveryDate(order.expected_delivery)}
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
                        onClick={() => onReceive(order.id)}
                        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-50 text-[12.5px] font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Marcar recibido
                      </button>
                      <button
                        type="button"
                        onClick={() => onCancel(order.id)}
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
  );
}
