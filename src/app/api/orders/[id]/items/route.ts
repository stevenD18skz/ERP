// POST /api/orders/:id/items   agrega una línea de producto a un pedido
//
// Solo funciona mientras el pedido sigue "pendiente" (ver add_order_item en
// supabase/sql/01_schema.sql): permite ir sumando productos a lo largo de
// varios días mientras se arma la lista de lo que hace falta pedir, sin tener
// que saberlo todo el mismo día en que se crea el pedido.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest, badRequest } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";
import { Fields, readJson, requireUuidParam } from "@/lib/api/validate";
import { toOrder, ORDER_SELECT } from "@/lib/api/mappers";
import type { OrderRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del pedido");

    const body = await readJson(request);
    const f = new Fields(body);
    const productId = f.uuid("product_id", { nullable: true }) ?? null;
    const productName = f.string("product", { max: 200, nullable: true }) ?? null;
    const quantity = f.number("quantity", { required: true, min: 0.001 });
    const unitCost = f.number("unit_cost", { min: 0 });
    f.check();

    const db = getSupabaseAdmin();
    const { data: rpcData, error: rpcError } = await db.rpc("add_order_item", {
      p_order_id: id,
      p_tienda_id: tiendaId,
      p_product_id: productId,
      p_product_name: productName,
      p_quantity: quantity,
      p_unit_cost: unitCost ?? null,
    });
    if (rpcError) throw fromPostgrest(rpcError, "agregar el producto al pedido");

    const orderRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!orderRow?.id) throw badRequest("El producto no se pudo agregar");

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
