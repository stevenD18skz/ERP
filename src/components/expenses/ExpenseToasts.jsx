"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const TONES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
  info: "border-slate-200 bg-white text-slate-700",
};

// Avisos de Gastos: pastillas claras abajo a la derecha, no la barra oscura
// centrada del resto de la aplicación. Esta pantalla es de escritorio y llena
// de tabla; el aviso se aparta en la esquina en vez de taparla.
export default function ExpenseToasts({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm shadow-lg ${TONES[t.type] || TONES.info}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{t.text}</span>
            <button
              onClick={() => onDismiss(t.id)}
              className="ml-2 opacity-50 hover:opacity-100"
              aria-label="Cerrar aviso"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
