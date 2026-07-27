"use client";

import { Check, Minus } from "lucide-react";

// Casilla cuadrada dibujada a mano en vez de un <input type="checkbox">: el
// diseño la pide más grande y con el estado "algunos seleccionados" (la raya),
// que el control nativo no sabe pintar sin trucos de JS.
export default function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px] border-slate-300 bg-white hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {checked && (
        <Check className="h-3.5 w-3.5 text-blue-600" strokeWidth={3} />
      )}
      {indeterminate && !checked && (
        <Minus className="h-3.5 w-3.5 text-blue-600" strokeWidth={3} />
      )}
    </button>
  );
}
