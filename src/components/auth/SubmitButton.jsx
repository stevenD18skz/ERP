"use client";

import { Loader2 } from "lucide-react";

const TONES = {
  blue: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25 focus-visible:ring-blue-500",
  teal: "bg-teal-600 hover:bg-teal-700 shadow-teal-600/25 focus-visible:ring-teal-500",
};

// Botón de envío con estado de carga. Se deshabilita mientras se envía para
// que un doble clic nervioso no dispare dos veces la misma petición.
export default function SubmitButton({
  loading,
  loadingLabel,
  children,
  accent = "blue",
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg px-4 text-[15px] font-semibold text-white shadow-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${TONES[accent]}`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {loading ? loadingLabel : children}
    </button>
  );
}
