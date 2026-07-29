"use client";

import { useEffect, useState } from "react";

// true solo después de montar en el navegador, siempre false en el servidor.
//
// Los hooks que usan SWR con caché persistida en localStorage (useSession,
// useDashboardData, useProductsCatalog, la página de Ventas) la usan para
// pasar `null` como key mientras no hay cliente todavía: así el primer
// render en el navegador coincide con el del servidor (sin datos), que es
// justo el que React compara al hidratar. Apenas monta, la key real entra y
// SWR lee de una la caché que ya estaba en memoria desde antes de este
// render -sin pedir nada a la API-, así que el cambio de "sin datos" a
// "datos ya puestos" pasa en el mismo instante, sin esperar ningún fetch.
export function useIsClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

export default useIsClient;
