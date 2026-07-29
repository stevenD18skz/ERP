"use client";

import { SWRConfig } from "swr";
import { localStorageProvider } from "@/lib/swrLocalStorageProvider";

// Envuelve toda la app en un único caché de SWR respaldado por localStorage
// (ver swrLocalStorageProvider). Tiene que vivir arriba de cualquier hook que
// use useSWR para que todos compartan el mismo mapa: así Inicio, Productos y
// Ventas piden "products" una sola vez entre los tres, y esa caché sigue ahí
// después de un F5.
export default function SWRProvider({ children }) {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      {children}
    </SWRConfig>
  );
}
