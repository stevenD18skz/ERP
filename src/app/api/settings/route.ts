// GET   /api/settings   configuración de la tienda de la sesión
// PATCH /api/settings   actualiza uno o varios campos
//
// La fila de tiendas guarda un solo jsonb (ver supabase/sql/01_schema.sql);
// mergeSettings es lo que le pone forma completa, tanto al leer como después
// de escribir, para que un settings viejo o a medio llenar nunca llegue
// incompleto a la pantalla.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";
import { Fields, compact, readJson, requireNonEmpty } from "@/lib/api/validate";
import {
  mergeSettings,
  PHONE_SCANNER_IDLE_MAX_SECONDS,
  PHONE_SCANNER_IDLE_MIN_SECONDS,
} from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readCurrentSettings(
  db: ReturnType<typeof getSupabaseAdmin>,
  tiendaId: string,
) {
  const { data, error } = await db
    .from("tiendas")
    .select("settings")
    .eq("id", tiendaId)
    .single();
  if (error) throw fromPostgrest(error, "la configuración de la tienda");
  return mergeSettings(data?.settings);
}

export async function GET(request: NextRequest) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const db = getSupabaseAdmin();
    return ok(await readCurrentSettings(db, tiendaId));
  });
}

export async function PATCH(request: NextRequest) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const body = await readJson(request);
    const f = new Fields(body);

    const phoneScannerAutoDisconnect = f.boolean("phoneScannerAutoDisconnect");
    const phoneScannerIdleSeconds = f.number("phoneScannerIdleSeconds", {
      integer: true,
      min: PHONE_SCANNER_IDLE_MIN_SECONDS,
      max: PHONE_SCANNER_IDLE_MAX_SECONDS,
    });
    f.check();

    const patch = compact({
      phoneScannerAutoDisconnect,
      phoneScannerIdleSeconds,
    });
    requireNonEmpty(patch);

    const db = getSupabaseAdmin();
    const current = await readCurrentSettings(db, tiendaId);
    const next = mergeSettings({ ...current, ...patch });

    const { data, error } = await db
      .from("tiendas")
      .update({ settings: next })
      .eq("id", tiendaId)
      .select("settings")
      .single();
    if (error) throw fromPostgrest(error, "la configuración de la tienda");

    return ok(mergeSettings(data?.settings));
  });
}
