// GET /api/health
//
// Dice si la aplicación puede hablar con Supabase y si la base ya tiene el
// esquema y los datos. Es lo primero que hay que abrir cuando algo "no carga":
// distingue entre falta configurar las variables, falta correr el SQL, o la
// base responde pero está vacía.
//
// Responde 200 cuando todo está bien y 503 cuando no, para poder usarlo como
// health check desde afuera.

import type { NextRequest } from "next/server";

import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  isUsingServiceRole,
  supabaseProjectUrl,
} from "@/lib/supabase/server";
import { handle } from "@/lib/api/http";
import { toApiError } from "@/lib/api/errors";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLES = [
  "products",
  "sales",
  "orders",
  "expenses",
  "daily_closes",
] as const;

export async function GET(_request: NextRequest) {
  return handle(async () => {
    const base = {
      configurado: isSupabaseConfigured,
      // Sin la service_role key las rutas usan la anon key, y con RLS activo
      // eso devuelve listas vacías en vez de un error: conviene saberlo.
      usando_service_role: isUsingServiceRole,
      proyecto: supabaseProjectUrl || null,
      revisado: new Date().toISOString(),
    };

    if (!isSupabaseConfigured) {
      return NextResponse.json(
        {
          data: {
            ...base,
            estado: "sin_configurar",
            mensaje:
              "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local. Ver supabase/README.md.",
          },
        },
        { status: 503 },
      );
    }

    const db = getSupabaseAdmin();
    const conteos: Record<string, number | null> = {};
    const problemas: string[] = [];

    for (const table of TABLES) {
      const { count, error } = await db
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) {
        conteos[table] = null;
        problemas.push(`${table}: ${toApiError(error).message}`);
      } else {
        conteos[table] = count ?? 0;
      }
    }

    const sinEsquema = problemas.length === TABLES.length;
    const vacia = !sinEsquema && Object.values(conteos).every((c) => !c);

    const estado = sinEsquema
      ? "sin_esquema"
      : problemas.length
        ? "con_errores"
        : vacia
          ? "vacia"
          : "ok";
    const mensaje = {
      sin_esquema:
        "La base responde pero no tiene las tablas. Correr los archivos de supabase/sql en orden.",
      con_errores: "Algunas tablas no se pudieron leer.",
      // Las semillas 02, 03 y 04 solo sirven sobre un esquema recién creado:
      // escriben columnas que las migraciones posteriores cambiaron. Sobre una
      // base ya migrada, el catálogo se carga desde la propia aplicación.
      vacia:
        "El esquema está creado pero sin datos. Se llena desde la aplicación (Productos → Nuevo o Importar), o desde cero con 99_reset.sql y toda la carpeta supabase/sql en orden.",
      ok: "Todo conectado.",
    }[estado];

    return NextResponse.json(
      {
        data: {
          ...base,
          estado,
          mensaje,
          conteos,
          ...(problemas.length ? { problemas } : {}),
        },
      },
      { status: estado === "ok" || estado === "vacia" ? 200 : 503 },
    );
  });
}
