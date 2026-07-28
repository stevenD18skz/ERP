// GET /api/products/brands
// Las marcas de la tienda, con cuántos productos tiene cada una. Es la gemela
// de /api/products/categories: misma forma, misma razón de existir.
//
// La marca se crea desde el formulario del producto, junto con él. Esta ruta es
// para llenar el select y los filtros con las que ya existen, incluidas las que
// se quedaron sin productos.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";
import { toBrand } from "@/lib/api/mappers";
import type { ProductBrandRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("v_product_brands")
      .select("*")
      .eq("tienda_id", tiendaId)
      .order("brand", { ascending: true });
    if (error) throw fromPostgrest(error, "el listado de marcas");

    return ok((data as ProductBrandRow[]).map(toBrand));
  });
}
