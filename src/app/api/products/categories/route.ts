// GET /api/products/categories
// Las categorías de la tienda, con cuántos productos tiene cada una. Sirve para
// armar los filtros y el select del formulario sin traerse todo el catálogo.
//
// Las categorías son una tabla propia (supabase/sql/01_schema.sql), así que
// acá aparecen también las que todavía no tienen ningún producto adentro.
//
// Next resuelve primero los segmentos fijos, así que esta ruta gana sobre
// /api/products/[id] y "categories" nunca llega como id.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";
import { toCategory } from "@/lib/api/mappers";
import type { ProductCategoryRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("v_product_categories")
      .select("*")
      .eq("tienda_id", tiendaId)
      .order("category", { ascending: true });
    if (error) throw fromPostgrest(error, "el listado de categorías");

    return ok((data as ProductCategoryRow[]).map(toCategory));
  });
}
