"use client";

import { CheckCircle2, Printer } from "lucide-react";
import { currency } from "@/utils/converts";
import { METHOD_LABELS } from "./salesUtils";

// Comprobante de que la venta quedó registrada. La línea del medio dice lo que
// hace falta según cómo se pagó: el vuelto en efectivo, a nombre de quién quedó
// el fiado, o el medio usado en tarjeta y transferencia.
export default function ReceiptModal({ data, onPrint, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-3.5 rounded-2xl bg-white p-7 text-center shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
          <CheckCircle2 className="h-7 w-7 text-teal-600" />
        </div>
        <div className="text-lg font-extrabold text-slate-900">
          Venta registrada
        </div>
        <div className="text-[30px] font-extrabold tabular-nums text-slate-900">
          {currency(data.total)}
        </div>
        <div className="text-sm text-slate-500">
          {data.method === "efectivo"
            ? `Vuelto: ${currency(Math.max(0, data.vuelto || 0))}`
            : data.method === "fiado"
              ? `Fiado a nombre de ${data.cliente}`
              : `Pagado con ${METHOD_LABELS[data.method]}`}
        </div>
        <div className="mt-1.5 flex w-full gap-2.5">
          <button
            type="button"
            onClick={() => onPrint(data)}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-[14.5px] font-bold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" /> Imprimir recibo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-lg bg-teal-600 text-[14.5px] font-bold text-white hover:bg-teal-700"
          >
            Nueva venta
          </button>
        </div>
      </div>
    </div>
  );
}
