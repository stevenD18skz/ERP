// PATCH /api/products/categories/:id
// Renombra una categoría existente. Los productos que ya la tienen no se
// tocan: guardan el category_id, así que la próxima vez que se lean traen el
// nombre nuevo solos (ver v_products en supabase/sql/01_schema.sql).

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { requireTiendaId } from "@/lib/api/auth";
import { Fields, readJson, requireUuidParam } from "@/lib/api/validate";
import { renameTaxonomy } from "@/lib/api/taxonomy";
import { toCategory } from "@/lib/api/mappers";
import type { ProductCategoryRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const { id } = await context.params;
    requireUuidParam(id, "El identificador de la categoría");

    const body = await readJson(request);
    const f = new Fields(body);
    const name = f.string("name", { required: true, max: 120 });
    f.check();

    const db = getSupabaseAdmin();
    const row = await renameTaxonomy(db, "categories", tiendaId, id, name);

    return ok(toCategory(row as unknown as ProductCategoryRow));
  });
}
