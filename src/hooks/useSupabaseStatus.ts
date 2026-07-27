"use client";

import { useEffect, useState } from "react";
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabaseClient";

export type SupabaseStatus = "connected" | "disconnected" | "checking";

const CHECK_INTERVAL_MS = 30000;
const CHECK_TIMEOUT_MS = 5000;

// Ping ligero al servicio de Auth de Supabase (GoTrue) para confirmar que
// el proyecto configurado en las variables de entorno responde de verdad,
// no solo que las credenciales tengan el formato correcto.
export function useSupabaseStatus(): SupabaseStatus {
  const [status, setStatus] = useState<SupabaseStatus>("checking");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("disconnected");
      return;
    }

    let cancelled = false;

    const checkConnection = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
      try {
        const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
          signal: controller.signal,
          headers: { apikey: supabaseAnonKey },
        });
        if (!cancelled) setStatus(res.ok ? "connected" : "disconnected");
      } catch {
        if (!cancelled) setStatus("disconnected");
      } finally {
        clearTimeout(timeout);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return status;
}
