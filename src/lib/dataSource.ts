// De dónde leen y escriben los servicios.
//
// Un solo interruptor para toda la aplicación:
//   simulación encendida -> los datos de mentira guardados en la pestaña
//   simulación apagada   -> los datos del negocio (hoy el mock del Excel)
//
// Los servicios no saben en cuál de los dos están; piden la colección por
// nombre y guardan cuando la cambian. Cuando el front se conecte a /api, el
// cambio se hace aquí adentro y la simulación sigue funcionando igual.

import { products, sales, orders, expenses, dailyCloses } from "./mockDb";
import {
  isSimulationOn,
  simulationCollection,
  commitCollection,
  type CollectionName,
} from "./simulation/store";

export type { CollectionName };

const business = { products, sales, orders, expenses, dailyCloses };

/** El arreglo vivo de una colección. Se puede mutar en el sitio. */
export function collection<K extends CollectionName>(
  name: K,
): (typeof business)[K] {
  if (isSimulationOn()) {
    return simulationCollection(name) as (typeof business)[K];
  }
  return business[name];
}

/**
 * Guarda los cambios. En simulación escribe en sessionStorage; fuera de ella no
 * hace nada, porque el mock ya quedó modificado en memoria.
 */
export function commit(name: CollectionName): void {
  if (isSimulationOn()) commitCollection(name);
}

export { isSimulationOn };
