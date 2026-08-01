"use client";

// Sesión de tienda en el cliente, cacheada con SWR.
//
// TopBar y SideBar llaman a este hook a la vez apenas monta AppShell, en
// cualquier página. Con un caché casero a mano (como tenía antes) los dos se
// alcanzan a montar antes de que el primer fetch resuelva y termina
// pidiéndose /api/auth/me dos veces; SWR deduplica pedidos concurrentes a la
// misma key, así que sea cual sea la página, solo sale un pedido.
//
// Igual que en useProductsCatalog: sin revalidación automática (foco,
// reconexión) ni reintentos solos, porque la sesión no cambia sin que la
// tienda cierre sesión o inicie una nueva.
import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import { clearPersistedSWRCache } from "@/lib/swrLocalStorageProvider";
import { clearPhoneScannerPairing } from "@/lib/phoneScanner";
import { useIsClient } from "@/hooks/useIsClient";

export type SessionTienda = {
  nombre: string;
  dueno: string;
  email: string;
} | null;

const SESSION_KEY = "/api/auth/me";

async function fetchSession(): Promise<SessionTienda> {
  const res = await fetch(SESSION_KEY, { credentials: "same-origin" });
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.data ?? null;
}

export function useSession() {
  // key en null hasta montar: la caché ya trae la sesión restaurada de
  // localStorage desde antes de este render, pero el servidor nunca la tiene.
  // Sin este freno, el primerísimo render en el navegador (el que React
  // compara contra el HTML del servidor al hidratar) ya mostraría el dato
  // real y saltaría un desajuste de hidratación en cualquier componente que
  // pinte `tienda` (TopBar, SideBar, Inicio...).
  const isClient = useIsClient();
  const { data, isLoading, mutate } = useSWR(
    isClient ? SESSION_KEY : null,
    fetchSession,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    },
  );
  const { cache, mutate: globalMutate } = useSWRConfig();

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // No solo la sesión: se vacía toda la caché de SWR (productos, ventas,
    // etc.), porque queda respaldada en localStorage. Si no se limpia acá, la
    // próxima tienda que inicie sesión en este mismo aparato vería de entrada
    // los datos de esta tienda -varias claves tienen revalidateIfStale:
    // false, así que ni se refrescarían solas.
    for (const key of cache.keys()) {
      globalMutate(key, undefined, { revalidate: false });
    }
    clearPersistedSWRCache();
    // Y el celular emparejado: si no, el que quedó vinculado con esta tienda
    // seguiría metiendo códigos en la pantalla de la que inicie sesión después.
    clearPhoneScannerPairing();
    window.location.href = "/login";
  }, [cache, globalMutate]);

  return { tienda: data ?? null, loading: !isClient || isLoading, logout };
}
