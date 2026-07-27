// GET /api/products/categories
// Las categorías que existen hoy en el catálogo, con cuántos productos tiene
// cada una. Sirve para armar los filtros sin traerse los 435 productos.
//
// Next resuelve primero los segmentos fijos, así que esta ruta gana sobre
// /api/products/[id] y "categories" nunca llega como id.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest } from "@/lib/api/errors";
import { toCategory } from "@/lib/api/mappers";
import type { ProductCategoryRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  return handle(async () => {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("v_product_categories")
      .select("*")
      .order("category", { ascending: true });
    if (error) throw fromPostgrest(error, "el listado de categorías");

    return ok((data as ProductCategoryRow[]).map(toCategory));
  });
}
