// POST /api/orders/:id/receive
// Marca el pedido como recibido y suma su mercancía al inventario.
//
// Cuerpo opcional:
//   { "adjust_stock": false }  recibe sin tocar el inventario
//   { "update_cost": true }    además actualiza el costo del catálogo con el
//                              costo del pedido y lo marca como costo real
//                              (cost_is_estimated = false). Va apagado por
//                              defecto porque pisa datos del negocio.
//
// Es idempotente: recibir dos veces el mismo pedido no suma el stock dos veces.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest, notFound } from "@/lib/api/errors";
import { Fields, requireUuidParam } from "@/lib/api/validate";
import { toOrder, ORDER_SELECT } from "@/lib/api/mappers";
import type { OrderRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  return handle(async () => {
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del pedido");

    // El cuerpo es opcional: recibir sin opciones es lo normal.
    let body: Record<string, unknown> = {};
    try {
      const parsed = await request.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        body = parsed as Record<string, unknown>;
      }
    } catch {
      body = {};
    }

    const f = new Fields(body);
    const adjustStock = f.boolean("adjust_stock");
    const updateCost = f.boolean("update_cost");
    f.check();

    const db = getSupabaseAdmin();
    const { error } = await db.rpc("receive_order", {
      p_order_id: id,
      p_adjust_stock: adjustStock ?? true,
      p_update_cost: updateCost ?? false,
    });
    if (error) throw fromPostgrest(error, "la recepción del pedido");

    const { data, error: readError } = await db
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (readError) throw fromPostgrest(readError, "la lectura del pedido");
    if (!data) throw notFound("No existe un pedido con ese identificador");

    return ok(toOrder(data as OrderRow));
  });
}
