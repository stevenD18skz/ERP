"use client";

import {
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  UserRound,
} from "lucide-react";
import MoneyInput from "@/components/ui/MoneyInput";
import { currency, formatMoney } from "@/utils/converts";
import { QUICK_CASH } from "./salesUtils";

function PaymentMethodButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] px-2 text-sm font-bold transition-colors ${
        active
          ? "border-teal-600 bg-teal-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {label}
    </button>
  );
}

const METHODS = [
  { key: "efectivo", icon: Banknote, label: "Efectivo" },
  { key: "tarjeta", icon: CreditCard, label: "Tarjeta" },
  { key: "transferencia", icon: ArrowLeftRight, label: "Transferencia" },
  { key: "fiado", icon: UserRound, label: "Fiado" },
];

// Cobro de la venta: total, medio de pago y lo que cada medio pide.
//
// El vuelto se calcula acá porque solo depende del total y de lo recibido. Se
// muestra en rojo con el faltante cuando el monto no alcanza, en vez de un
// negativo que hay que interpretar: quien cobra necesita ver de un vistazo
// cuánto le falta por recibir.
export default function PaymentPanel({
  total,
  paymentMethod,
  onPaymentMethodChange,
  receivedAmount,
  onReceivedAmountChange,
  onQuickCash,
  onExactAmount,
  clientName,
  onClientNameChange,
  errors,
  confirming,
  onCancel,
  onConfirm,
}) {
  const receivedNum = parseFloat(receivedAmount);
  const vuelto = (Number.isNaN(receivedNum) ? 0 : receivedNum) - total;
  const insufficient =
    receivedAmount !== "" &&
    (Number.isNaN(receivedNum) || receivedNum < total);

  return (
    <div className="rounded-xl bg-white p-[18px] shadow-sm ring-1 ring-slate-100">
      <div className="mb-4 flex items-baseline justify-between">
        <div className="text-[22px] font-bold text-slate-900">
          Total a cobrar
        </div>
        <div className="text-[28px] font-extrabold tabular-nums text-slate-900">
          {currency(total)}
        </div>
      </div>

      <div className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-slate-500">
        Método de pago
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METHODS.map((m) => (
          <PaymentMethodButton
            key={m.key}
            active={paymentMethod === m.key}
            onClick={() => onPaymentMethodChange(m.key)}
            icon={m.icon}
            label={m.label}
          />
        ))}
      </div>

      {paymentMethod === "efectivo" && (
        <div className="flex  justify-between">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-900">
              Monto recibido <span className="text-red-500">*</span>
            </label>
            <MoneyInput
              value={receivedAmount}
              onChange={onReceivedAmountChange}
              aria-invalid={!!errors.monto}
              className={`h-12 w-full max-w-[220px] rounded-lg border px-3.5 text-lg font-bold tabular-nums outline-none focus:ring-2 ${errors.monto ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-teal-500 focus:ring-teal-100"}`}
            />

            {errors.monto && (
              <div className="mt-1.5 text-xs font-semibold text-red-600">
                {errors.monto}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_CASH.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => onQuickCash(amount)}
                  className="h-[38px] rounded-full bg-teal-50 px-3.5 text-[13.5px] font-bold text-teal-800 hover:bg-teal-100"
                >
                  +{formatMoney(amount)}
                </button>
              ))}
              <button
                type="button"
                onClick={onExactAmount}
                className="h-[38px] rounded-full border-[1.5px] border-teal-600 bg-white px-3.5 text-[13.5px] font-bold text-teal-700 hover:bg-teal-50"
              >
                Monto exacto
              </button>
            </div>
          </div>

          <div
            className={`mt-4 flex items-center justify-between rounded-lg p-3.5 ${insufficient ? "bg-red-50" : "bg-teal-50"}`}
          >
            <div
              className={`mr-4 flex items-center gap-2 text-sm font-bold ${insufficient ? "text-red-700" : "text-teal-800"}`}
            >
              {insufficient && <AlertTriangle className="h-[17px] w-[17px]" />}
              {insufficient ? "Falta por cobrar" : "Vuelto"}
            </div>
            <div
              className={`text-xl font-extrabold tabular-nums ${insufficient ? "text-red-700" : "text-teal-800"}`}
            >
              {currency(
                insufficient
                  ? total - (Number.isNaN(receivedNum) ? 0 : receivedNum)
                  : vuelto,
              )}
            </div>
          </div>
        </div>
      )}

      {(paymentMethod === "tarjeta" || paymentMethod === "transferencia") && (
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
            onChange={(e) => onClientNameChange(e.target.value)}
            placeholder="Ej. Don Roberto"
            aria-invalid={!!errors.cliente}
            className={`h-[46px] w-full max-w-xs rounded-lg border px-3.5 text-[15px] outline-none focus:ring-2 ${errors.cliente ? "border-red-400 focus:ring-red-100" : "border-slate-200 focus:border-teal-500 focus:ring-teal-100"}`}
          />
          {errors.cliente && (
            <div className="mt-1.5 text-xs font-semibold text-red-600">
              {errors.cliente}
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
          onClick={onCancel}
          disabled={confirming}
          className="h-[50px] flex-1 rounded-lg border border-slate-200 text-[15px] font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar venta
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirming}
          className="flex h-[50px] flex-[2] items-center justify-center gap-2 rounded-lg bg-teal-600 text-[15px] font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {confirming && <Loader2 className="h-[18px] w-[18px] animate-spin" />}
          {confirming ? "Registrando..." : "Registrar venta"}
        </button>
      </div>
    </div>
  );
}
