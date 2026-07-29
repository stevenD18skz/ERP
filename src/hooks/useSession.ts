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
import useSWR from "swr";

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
  const { data, isLoading, mutate } = useSWR(SESSION_KEY, fetchSession, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
  });

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await mutate(null, { revalidate: false });
    window.location.href = "/login";
  }, [mutate]);

  return { tienda: data ?? null, loading: isLoading, logout };
}
