"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";

const ICONS = { error: XCircle, success: CheckCircle2, info: Info };
const ICON_COLORS = {
  error: "text-red-400",
  success: "text-emerald-400",
  info: "text-teal-300",
};

export default function ToastStack({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      role="status"
      className="fixed inset-x-0 bottom-6 z-[70] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div
            key={t.id}
            className="flex w-full max-w-md animate-fade-slide-up items-center gap-3 rounded-xl bg-slate-900 px-4 py-3.5 text-white shadow-xl"
          >
            <Icon
              className={`h-[18px] w-[18px] shrink-0 ${ICON_COLORS[t.type] || ICON_COLORS.info}`}
            />
            <span className="flex-1 text-sm font-medium">{t.text}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action.onClick();
                  onDismiss(t.id);
                }}
                className="shrink-0 text-sm font-bold text-teal-300 hover:text-teal-200"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Cerrar notificación"
              className="shrink-0 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
