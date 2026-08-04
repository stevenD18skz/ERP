// PATCH /api/orders/:id/items/:itemId   cambia la fase de UN producto del pedido
//
// "recibido" no se acepta acá: se pone solo, junto para todas las líneas, al
// recibir el pedido completo (POST /api/orders/:id/receive) porque el
// proveedor siempre entrega todo de una vez, nunca por partes.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest, notFound, badRequest } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";
import { Fields, readJson, requireUuidParam } from "@/lib/api/validate";
import { toOrder, ORDER_SELECT } from "@/lib/api/mappers";
import type { OrderRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEM_STATUSES = ["por_pedir", "en_espera", "cancelado"] as const;

type Context = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const { id, itemId } = await context.params;
    requireUuidParam(id, "El identificador del pedido");
    requireUuidParam(itemId, "El identificador del producto del pedido");

    const body = await readJson(request);
    const f = new Fields(body);
    const status = f.oneOf("status", ITEM_STATUSES, { required: true });
    f.check();

    const db = getSupabaseAdmin();
    const { data: rpcData, error: rpcError } = await db.rpc(
      "update_order_item_status",
      {
        p_order_item_id: itemId,
        p_tienda_id: tiendaId,
        p_status: status,
      },
    );
    if (rpcError)
      throw fromPostgrest(rpcError, "el cambio de estado del producto");

    const orderRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!orderRow?.id) throw notFound("Producto del pedido no encontrado");
    if (orderRow.id !== id) {
      throw badRequest("Ese producto no pertenece a este pedido");
    }

    const { data, error } = await db
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", id)
      .eq("tienda_id", tiendaId)
      .single();
    if (error) throw fromPostgrest(error, "la lectura del pedido");

    return ok(toOrder(data as OrderRow));
  });
}
