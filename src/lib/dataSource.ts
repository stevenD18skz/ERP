// De dónde leen y escriben los servicios EN MODO SIMULACIÓN. Fuera de
// simulación cada servicio pega directo a /api (ver products.service.js y
// compañía); este archivo no interviene ahí.
//
// Los servicios no necesitan saber cómo vive la simulación por dentro (hoy en
// sessionStorage, ver src/lib/simulation/store.ts): piden la colección por
// nombre y guardan cuando la cambian.

import {
  isSimulationOn,
  simulationCollection,
  commitCollection,
  type CollectionName,
} from "./simulation/store";

export type { CollectionName };

/** El arreglo vivo de una colección de la simulación. Se puede mutar en el sitio. */
export function collection<K extends CollectionName>(
  name: K,
): ReturnType<typeof simulationCollection<K>> {
  return simulationCollection(name);
}

/** Guarda en sessionStorage lo que haya quedado en memoria. */
export function commit(name: CollectionName): void {
  commitCollection(name);
}

export { isSimulationOn };
