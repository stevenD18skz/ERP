"use client";

import { useEffect, useState } from "react";

import {
  isSimulationOn,
  simulationStartedAt,
  subscribeToSimulation,
} from "@/lib/simulation/store";

// Si la simulación está encendida.
//
// Arranca siempre en false y se corrige después de montar: el servidor no
// puede leer sessionStorage, así que si se contestara distinto en el primer
// pintado React se quejaría de que el HTML no coincide.
export function useSimulation() {
  const [active, setActive] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setActive(isSimulationOn());
      setStartedAt(simulationStartedAt());
    };
    sync();
    return subscribeToSimulation(sync);
  }, []);

  return { active, startedAt };
}
