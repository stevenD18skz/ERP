// GET /api/summary?from=2025-01-01&to=2025-12-31
//
// Todos los indicadores del tablero en una sola llamada: cierres del Excel,
// ventas de la app, gastos por tipo, pedidos, inventario, el acumulado por mes
// y los cinco productos más vendidos del rango.
//
// Sin parámetros toma desde el primer cierre registrado hasta hoy.
//
// Ojo al leer la respuesta: "daily_closes" y "sales" son dos formas de contar
// lo mismo (el Excel de 2025 y las ventas registradas de ahora en adelante).
// Vienen separadas justamente para que nadie las sume.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest } from "@/lib/api/errors";
import { dateParam } from "@/lib/api/query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const from = dateParam(params.get("from"), "from");
    const to = dateParam(params.get("to"), "to");

    const db = getSupabaseAdmin();
    const { data, error } = await db.rpc("get_summary", {
      p_from: from,
      p_to: to,
    });
    if (error) throw fromPostgrest(error, "el resumen del negocio");

    return ok(data);
  });
}
