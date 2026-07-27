// GET    /api/products/:id   un producto
// PATCH  /api/products/:id   actualiza solo los campos que se manden
// DELETE /api/products/:id   borra el producto

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest, notFound } from "@/lib/api/errors";
import {
  Fields,
  readJson,
  compact,
  requireUuidParam,
  requireNonEmpty,
} from "@/lib/api/validate";
import { toProduct } from "@/lib/api/mappers";
import type { ProductRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  return handle(async () => {
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del producto");

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw fromPostgrest(error, "la consulta del producto");
    if (!data) throw notFound("No existe un producto con ese identificador");

    return ok(toProduct(data as ProductRow));
  });
}

export async function PATCH(request: NextRequest, context: Context) {
  return handle(async () => {
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del producto");

    const body = await readJson(request);
    const f = new Fields(body);

    const patch = compact({
      name: f.string("name", { max: 200 }),
      sku: f.string("sku", { max: 60 }),
      price: f.number("price", { min: 0 }),
      cost_price: f.number("cost_price", { min: 0 }),
      cost_is_estimated: f.boolean("cost_is_estimated"),
      barcode: f.string("barcode", { max: 60, allowEmpty: true }),
      photo: f.string("photo", { nullable: true, max: 2000 }),
      stock: f.number("stock"),
      category: f.string("category", { max: 120 }),
      description: f.string("description", { allowEmpty: true, max: 4000 }),
    });
    f.check();
    requireNonEmpty(patch);

    // Corregir el costo a mano es justamente lo que lo vuelve un dato firme.
    if (
      patch.cost_price !== undefined &&
      patch.cost_is_estimated === undefined
    ) {
      patch.cost_is_estimated = false;
    }

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("products")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw fromPostgrest(error, "la actualización del producto");
    if (!data) throw notFound("No existe un producto con ese identificador");

    return ok(toProduct(data as ProductRow));
  });
}

export async function DELETE(_request: NextRequest, context: Context) {
  return handle(async () => {
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del producto");

    const db = getSupabaseAdmin();
    // Las ventas y pedidos viejos no se borran: sus líneas quedan con el
    // nombre del producto y product_id en null (on delete set null).
    const { data, error } = await db
      .from("products")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw fromPostgrest(error, "el borrado del producto");
    if (!data) throw notFound("No existe un producto con ese identificador");

    return ok({ id, deleted: true });
  });
}
