// Cliente de Supabase para el servidor. Solo lo usan las rutas de src/app/api.
//
// Nunca importar esto desde un componente con "use client": la service_role key
// no lleva el prefijo NEXT_PUBLIC_ justamente para que no llegue al navegador.
// Con esa clave se salta RLS y se puede escribir cualquier tabla.
// (Para que el propio empaquetador lo impida, habría que instalar el paquete
// `server-only` y añadir su import aquí arriba.)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { normalizeSupabaseUrl } from "./url";
import { ApiError } from "@/lib/api/errors";

const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

// Se prefiere la service_role. La anon queda como respaldo para poder trabajar
// antes de configurarla, pero solo sirve si además se corrió
// supabase/sql/05_policies_dev.sql: sin políticas, RLS le niega todo y las
// consultas vuelven vacías.
const key = serviceKey || anonKey;

export const isSupabaseConfigured = Boolean(url && key);
export const isUsingServiceRole = Boolean(serviceKey);
export const supabaseProjectUrl = url;

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new ApiError(
      503,
      "Supabase no está configurado. Falta NEXT_PUBLIC_SUPABASE_URL o la clave del proyecto en .env.local.",
      "supabase_not_configured",
      {
        tiene_url: Boolean(url),
        tiene_service_role_key: Boolean(serviceKey),
        tiene_anon_key: Boolean(anonKey),
        como_arreglarlo: "Ver supabase/README.md",
      },
    );
  }

  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "erp-supermarket" } },
    });
  }

  return client;
}
