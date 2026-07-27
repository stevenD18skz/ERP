// GET    /api/orders/:id   un pedido con sus líneas
// PATCH  /api/orders/:id   cambia estado, proveedor, fecha de entrega o notas
// DELETE /api/orders/:id   borra el pedido y sus líneas
//
// Cambiar el estado a "recibido" o "cancelado" desde el PATCH mueve el
// inventario igual que los endpoints dedicados: pasa por las mismas funciones
// SQL para que no queden pedidos recibidos sin stock sumado.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest, notFound, badRequest } from "@/lib/api/errors";
import {
  Fields,
  readJson,
  compact,
  requireUuidParam,
} from "@/lib/api/validate";
import { toOrder, ORDER_SELECT } from "@/lib/api/mappers";
import type { OrderRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["pendiente", "recibido", "cancelado"] as const;

type Context = { params: Promise<{ id: string }> };

async function readOrder(db: ReturnType<typeof getSupabaseAdmin>, id: string) {
  const { data, error } = await db
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrest(error, "la consulta del pedido");
  if (!data) throw notFound("No existe un pedido con ese identificador");
  return data as OrderRow;
}

export async function GET(_request: NextRequest, context: Context) {
  return handle(async () => {
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del pedido");

    const db = getSupabaseAdmin();
    return ok(toOrder(await readOrder(db, id)));
  });
}

export async function PATCH(request: NextRequest, context: Context) {
  return handle(async () => {
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del pedido");

    const body = await readJson(request);
    const f = new Fields(body);

    const status = f.oneOf("status", STATUSES);
    const adjustStock = f.boolean("adjust_stock");
    const updateCost = f.boolean("update_cost");
    const patch = compact({
      order_date: f.datetime("order_date"),
      supplier: f.string("supplier", { max: 160 }),
      expected_delivery: f.date("expected_delivery", { nullable: true }),
      notes: f.string("notes", { allowEmpty: true, max: 2000 }),
      attachment: f.string("attachment", { nullable: true, max: 2000 }),
    });
    f.check();

    if (status === undefined && Object.keys(patch).length === 0) {
      throw badRequest("No se envió ningún campo para actualizar");
    }

    const db = getSupabaseAdmin();
    const current = await readOrder(db, id);

    if (Object.keys(patch).length > 0) {
      const { error } = await db.from("orders").update(patch).eq("id", id);
      if (error) throw fromPostgrest(error, "la actualización del pedido");
    }

    if (status && status !== current.status) {
      if (status === "recibido") {
        const { error } = await db.rpc("receive_order", {
          p_order_id: id,
          p_adjust_stock: adjustStock ?? true,
          p_update_cost: updateCost ?? false,
        });
        if (error) throw fromPostgrest(error, "la recepción del pedido");
      } else if (status === "cancelado") {
        const { error } = await db.rpc("cancel_order", {
          p_order_id: id,
          p_adjust_stock: adjustStock ?? true,
        });
        if (error) throw fromPostgrest(error, "la cancelación del pedido");
      } else {
        // Volver a "pendiente" un pedido ya recibido dejaría el stock sumado
        // sin respaldo. Primero hay que cancelarlo.
        if (current.status === "recibido") {
          throw badRequest(
            "Un pedido recibido no puede volver a pendiente: la mercancía ya entró al inventario. Cancelarlo primero.",
          );
        }
        const { error } = await db
          .from("orders")
          .update({ status })
          .eq("id", id);
        if (error) throw fromPostgrest(error, "el cambio de estado del pedido");
      }
    }

    return ok(toOrder(await readOrder(db, id)));
  });
}

export async function DELETE(_request: NextRequest, context: Context) {
  return handle(async () => {
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del pedido");

    const db = getSupabaseAdmin();
    const current = await readOrder(db, id);
    if (current.status === "recibido") {
      throw badRequest(
        "Un pedido recibido no se puede borrar: su mercancía ya está contada en el inventario. Cancelarlo primero.",
      );
    }

    const { error } = await db.from("orders").delete().eq("id", id);
    if (error) throw fromPostgrest(error, "el borrado del pedido");

    return ok({ id, deleted: true });
  });
}
