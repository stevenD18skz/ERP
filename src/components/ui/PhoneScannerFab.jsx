"use client";

import { Smartphone } from "lucide-react";

/*
  Botón flotante para vincular el celular como lector. Vive en la esquina
  inferior derecha y no en la fila de acciones de la cabecera: es un atajo
  que se usa una vez por turno (emparejar) y después casi nunca se toca, así
  que no tiene sentido que compita por sitio con "Nuevo producto" o
  "Exportar". Quien lo llama decide cuándo mostrarlo -por ejemplo, nunca en
  celular: ahí el propio aparato es el lector, no el que empareja uno.
*/
export default function PhoneScannerFab({ phoneConnected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        phoneConnected
          ? "Escanear con el celular (hay uno conectado)"
          : "Vincular el celular como lector"
      }
      title={
        phoneConnected
          ? "Celular conectado: ya puedes escanear con él"
          : "Vincular el celular como lector"
      }
      className={`fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${phoneConnected
          ? 'bg-green-600 shadow-lg shadow-green-600/30 hover:bg-green-700 focus-visible:ring-green-500'
          : 'bg-blue-600 shadow-lg shadow-blue-600/30 hover:bg-blue-700 focus-visible:ring-blue-500'
        } hover:scale-105 text-white`}
    >
      <Smartphone className="h-6 w-6" aria-hidden />
      {phoneConnected && (
        <span className="absolute right-1 top-1 flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
        </span>
      )}
    </button>
  );
}
