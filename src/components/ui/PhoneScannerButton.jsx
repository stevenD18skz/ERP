"use client";

import { Smartphone } from "lucide-react";

/*
  El botón que abre el emparejamiento, con el punto verde cuando ya hay un
  celular escuchando.

  Vive aparte de PhoneScannerModal a propósito: el modal arrastra el generador
  de QR, y el botón está siempre en pantalla mientras que el modal casi nunca
  se abre. Separados, la pantalla puede traer el botón de una y dejar el QR
  para cuando de verdad haga falta (ver el next/dynamic de quien lo usa).
*/
export default function PhoneScannerButton({
  phoneConnected,
  onClick,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`}
    >
      <Smartphone className="h-4 w-4" aria-hidden />
      Escanear con el celular
      {phoneConnected && (
        <span
          title="Hay un celular conectado"
          className="absolute right-2 top-2 flex h-2 w-2"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}
    </button>
  );
}
