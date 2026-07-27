"use client";

import { CalendarDays, History, ShoppingCart } from "lucide-react";

// Modos de la página de Ventas:
//  - transaccion: cobrar venta por venta con carrito.
//  - cierre: anotar un único total al final del día (como venía el Excel).
//  - historial: consultar las ventas ya registradas.
export const SALE_MODES = [
  { key: "transaccion", label: "Venta por venta", icon: ShoppingCart },
  { key: "cierre", label: "Cierre del día", icon: CalendarDays },
  { key: "historial", label: "Historial de ventas", icon: History },
];

export default function ModeSwitcher({ mode, onChange }) {
  return (
    <div className="mb-4 flex w-fit flex-wrap rounded-lg bg-white p-1 shadow-sm ring-1 ring-slate-100">
      {SALE_MODES.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          aria-pressed={mode === m.key}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            mode === m.key
              ? "bg-teal-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <m.icon className="h-4 w-4" />
          {m.label}
        </button>
      ))}
    </div>
  );
}
