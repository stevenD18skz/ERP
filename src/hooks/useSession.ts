"use client";

// Sesión de tienda en el cliente. Mismo patrón que useSimulation.ts: un
// caché a nivel de módulo (para no repetir el fetch en cada componente que
// lo use) más un hook que sincroniza el estado local con él.

import { useCallback, useEffect, useState } from "react";

export type SessionTienda = { nombre: string; dueno: string } | null;

let cached: SessionTienda | undefined; // undefined = todavía no se consultó

async function fetchSession(): Promise<SessionTienda> {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.data ?? null;
}

export function useSession() {
  const [tienda, setTienda] = useState<SessionTienda>(cached ?? null);
  const [loading, setLoading] = useState(cached === undefined);

  useEffect(() => {
    let alive = true;
    if (cached !== undefined) {
      setTienda(cached);
      setLoading(false);
      return;
    }
    fetchSession().then((t) => {
      cached = t;
      if (alive) {
        setTienda(t);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    cached = null;
    setTienda(null);
    window.location.href = "/login";
  }, []);

  return { tienda, loading, logout };
}
