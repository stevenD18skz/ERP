// Cliente de Supabase para el navegador.
//
// Con RLS activo y sin políticas, esta clave no puede leer ni escribir las
// tablas del negocio: los datos se piden a las rutas de /api, que se conectan
// desde el servidor. Esto queda para el chip de estado de la conexión.
// El cliente del servidor está en src/lib/supabase/server.ts.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { normalizeSupabaseUrl } from "./supabase/url";

export const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// null cuando falten las variables de entorno, para poder arrancar la app
// sin un proyecto de Supabase configurado todavía.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
