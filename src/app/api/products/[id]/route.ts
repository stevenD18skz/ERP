// GET    /api/products/:id   un producto
// PATCH  /api/products/:id   actualiza solo los campos que se manden
// DELETE /api/products/:id   borra el producto

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest, notFound } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";
import {
  Fields,
  readJson,
  compact,
  requireUuidParam,
  requireNonEmpty,
} from "@/lib/api/validate";
import { toProduct } from "@/lib/api/mappers";
import { resolveTaxonomyId, readProductRow } from "@/lib/api/taxonomy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del producto");

    const db = getSupabaseAdmin();
    const row = await readProductRow(db, id, tiendaId);
    if (!row) throw notFound("No existe un producto con ese identificador");

    return ok(toProduct(row));
  });
}

export async function PATCH(request: NextRequest, context: Context) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del producto");

    const body = await readJson(request);
    const f = new Fields(body);

    // Los campos se leen todos primero para que f.check() junte los errores de
    // una sola vez, y recién después se va a la base a resolver la categoría y
    // la marca: no tiene sentido crear una categoría si el precio venía mal.
    const name = f.string("name", { max: 200 });
    // Igual que en POST: el SKU es opcional (el campo ni siquiera está en el
    // formulario), así que un "" no puede tumbar el guardado.
    const sku = f.string("sku", { max: 60, allowEmpty: true });
    const price = f.number("price", { min: 0 });
    const costPrice = f.number("cost_price", { min: 0 });
    const barcode = f.string("barcode", { max: 60, allowEmpty: true });
    const photo = f.string("photo", { nullable: true, max: 2000 });
    const stock = f.number("stock");
    const description = f.string("description", { allowEmpty: true, max: 4000 });
    const category = f.string("category", { max: 120, allowEmpty: true });
    const categoryId = f.uuid("category_id", { nullable: true });
    const brand = f.string("brand", { max: 120, allowEmpty: true });
    const brandId = f.uuid("brand_id", { nullable: true });
    f.check();

    const db = getSupabaseAdmin();

    // resolveTaxonomyId distingue las tres respuestas que compact necesita:
    // undefined = no vino y no se toca, null = quitarla, id = ponerla (y
    // crearla si el nombre es nuevo).
    const resolvedCategory = await resolveTaxonomyId(
      db,
      "categories",
      tiendaId,
      { id: categoryId, name: category },
    );
    const resolvedBrand = await resolveTaxonomyId(db, "brands", tiendaId, {
      id: brandId,
      name: brand,
    });

    const patch = compact({
      name,
      sku,
      price,
      cost_price: costPrice,
      barcode,
      photo,
      stock,
      description,
      category_id: resolvedCategory,
      brand_id: resolvedBrand,
    });
    requireNonEmpty(patch);

    const { data, error } = await db
      .from("products")
      .update(patch)
      .eq("id", id)
      .eq("tienda_id", tiendaId)
      .select("id")
      .maybeSingle();
    if (error) throw fromPostgrest(error, "la actualización del producto");
    if (!data) throw notFound("No existe un producto con ese identificador");

    const row = await readProductRow(db, id, tiendaId);
    if (!row) throw notFound("No existe un producto con ese identificador");

    return ok(toProduct(row));
  });
}

export async function DELETE(request: NextRequest, context: Context) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del producto");

    const db = getSupabaseAdmin();
    // Las ventas y pedidos viejos no se borran: sus líneas quedan con el
    // nombre del producto y product_id en null (on delete set null).
    const { data, error } = await db
      .from("products")
      .delete()
      .eq("id", id)
      .eq("tienda_id", tiendaId)
      .select("id")
      .maybeSingle();
    if (error) throw fromPostgrest(error, "el borrado del producto");
    if (!data) throw notFound("No existe un producto con ese identificador");

    return ok({ id, deleted: true });
  });
}
