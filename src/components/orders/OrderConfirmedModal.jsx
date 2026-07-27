"use client";

import { CheckCircle2, Printer } from "lucide-react";
import { currency } from "@/utils/converts";
import { formatDeliveryDate } from "./ordersUtils";

// Comprobante de que el pedido quedó registrado, con la opción de imprimir la
// orden para llevársela al proveedor.
export default function OrderConfirmedModal({ data, onPrint, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-3.5 rounded-2xl bg-white p-7 text-center shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
          <CheckCircle2 className="h-7 w-7 text-indigo-600" />
        </div>
        <div className="text-lg font-extrabold text-slate-900">
          Pedido registrado
        </div>
        <div className="text-[30px] font-extrabold tabular-nums text-slate-900">
          {currency(data.total)}
        </div>
        <div className="text-sm text-slate-500">
          Pedido a {data.supplier} · entrega esperada{" "}
          {formatDeliveryDate(data.expectedDelivery)}
        </div>
        <div className="mt-1.5 flex w-full gap-2.5">
          <button
            type="button"
            onClick={() => onPrint(data)}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-[14.5px] font-bold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" /> Imprimir orden
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-lg bg-indigo-600 text-[14.5px] font-bold text-white hover:bg-indigo-700"
          >
            Nuevo pedido
          </button>
        </div>
      </div>
    </div>
  );
}
