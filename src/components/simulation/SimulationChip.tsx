"use client";

import { FlaskConical } from "lucide-react";

import { useSimulation } from "@/hooks/useSimulation";

// Recordatorio discreto en la barra superior: mientras la simulación está
// encendida no puede pasar inadvertido, pero tampoco necesita ocupar una
// franja entera de la pantalla. Los botones de acción viven en el SideBar.
export default function SimulationChip() {
  const { active } = useSimulation();

  if (!active) return null;

  return (
    <div
      title="Modo simulación: datos de prueba, no toca la información real de la tienda. Se borra al cerrar la pestaña."
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
    >
      <FlaskConical className="h-3.5 w-3.5" aria-hidden />
      <span className="hidden sm:inline">Modo simulación</span>
    </div>
  );
}
