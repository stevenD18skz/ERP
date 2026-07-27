// GET    /api/sales/:id   una venta con sus líneas
// PATCH  /api/sales/:id   anula la venta o corrige el encabezado
// DELETE /api/sales/:id   borra la venta y sus líneas
//
// Para deshacer una venta lo normal es anularla ({ "voided": true }): queda en
// el historial y el inventario se devuelve solo. El DELETE es para arreglar un
// registro que nunca debió existir.

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
import { toSale, SALE_SELECT } from "@/lib/api/mappers";
import type { SaleRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYMENT_METHODS = [
  "efectivo",
  "tarjeta",
  "transferencia",
  "fiado",
] as const;

type Context = { params: Promise<{ id: string }> };

async function readSale(db: ReturnType<typeof getSupabaseAdmin>, id: string) {
  const { data, error } = await db
    .from("sales")
    .select(SALE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrest(error, "la consulta de la venta");
  if (!data) throw notFound("No existe una venta con ese identificador");
  return data as SaleRow;
}

export async function GET(_request: NextRequest, context: Context) {
  return handle(async () => {
    const { id } = await context.params;
    requireUuidParam(id, "El identificador de la venta");

    const db = getSupabaseAdmin();
    return ok(toSale(await readSale(db, id)));
  });
}

export async function PATCH(request: NextRequest, context: Context) {
  return handle(async () => {
    const { id } = await context.params;
    requireUuidParam(id, "El identificador de la venta");

    const body = await readJson(request);
    const f = new Fields(body);

    const voided = f.boolean("voided");
    const restoreStock = f.boolean("restore_stock");
    const patch = compact({
      sale_date: f.datetime("sale_date"),
      payment_method: f.oneOf("payment_method", PAYMENT_METHODS),
      client_name: f.string("client_name", { nullable: true, max: 160 }),
    });
    f.check();

    if (voided === undefined && Object.keys(patch).length === 0) {
      throw badRequest(
        'No se envió nada para cambiar. Para anular la venta: { "voided": true }',
      );
    }

    const db = getSupabaseAdmin();
    const current = await readSale(db, id);

    if (voided === false && current.voided) {
      throw badRequest(
        "Una venta anulada no se puede reactivar. Si la venta sí ocurrió, hay que registrarla de nuevo.",
      );
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await db.from("sales").update(patch).eq("id", id);
      if (error) throw fromPostgrest(error, "la actualización de la venta");
    }

    // La anulación pasa por la función SQL para que devolver el inventario y
    // marcar la venta ocurran juntos.
    if (voided === true && !current.voided) {
      const { error } = await db.rpc("void_sale", {
        p_sale_id: id,
        p_restore_stock: restoreStock ?? true,
      });
      if (error) throw fromPostgrest(error, "la anulación de la venta");
    }

    return ok(toSale(await readSale(db, id)));
  });
}

export async function DELETE(_request: NextRequest, context: Context) {
  return handle(async () => {
    const { id } = await context.params;
    requireUuidParam(id, "El identificador de la venta");

    const db = getSupabaseAdmin();
    // Borrar no devuelve el stock: si la mercancía volvió al estante, anular.
    const { data, error } = await db
      .from("sales")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw fromPostgrest(error, "el borrado de la venta");
    if (!data) throw notFound("No existe una venta con ese identificador");

    return ok({ id, deleted: true });
  });
}
