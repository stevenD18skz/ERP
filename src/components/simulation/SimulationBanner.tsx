"use client";

import { FlaskConical, RotateCcw, LogOut } from "lucide-react";

import { useSimulation } from "@/hooks/useSimulation";
import { restartSimulation, stopSimulation } from "@/lib/simulation/store";

// Aviso permanente mientras la simulación está encendida. Tiene que ser
// imposible de confundir: quien esté probando debe saber en todo momento que
// lo que ve no es la tienda de verdad.
export default function SimulationBanner() {
  const { active } = useSimulation();

  if (!active) return null;

  // Se recarga la página a propósito en vez de refrescar el estado: cada
  // pantalla pide sus datos al montarse, así que recargar es lo único que las
  // deja a todas viendo lo mismo después de reiniciar o salir.
  const handleRestart = () => {
    restartSimulation();
    window.location.reload();
  };

  const handleExit = () => {
    stopSimulation();
    window.location.assign("/");
  };

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-amber-300 bg-amber-50 px-4 py-2 md:px-6"
    >
      <FlaskConical className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />

      <p className="text-sm text-amber-900">
        <span className="font-semibold">Modo simulación.</span>{" "}
        <span className="text-amber-800">
          Datos de prueba: nada de lo que hagas aquí toca la información de la
          tienda. Se borra al cerrar la pestaña.
        </span>
      </p>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={handleRestart}
          className="flex min-h-[36px] items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 text-[13px] font-medium text-amber-800 transition-colors hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reiniciar datos
        </button>

        <button
          type="button"
          onClick={handleExit}
          className="flex min-h-[36px] items-center gap-1.5 rounded-md bg-amber-600 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          Salir
        </button>
      </div>
    </div>
  );
}
