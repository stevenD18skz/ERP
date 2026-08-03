// PATCH /api/products/brands/:id
// Renombra una marca existente. Es la gemela de
// /api/products/categories/[id]: misma forma, misma razón de existir.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { requireTiendaId } from "@/lib/api/auth";
import { Fields, readJson, requireUuidParam } from "@/lib/api/validate";
import { renameTaxonomy } from "@/lib/api/taxonomy";
import { toBrand } from "@/lib/api/mappers";
import type { ProductBrandRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const { id } = await context.params;
    requireUuidParam(id, "El identificador de la marca");

    const body = await readJson(request);
    const f = new Fields(body);
    const name = f.string("name", { required: true, max: 120 });
    f.check();

    const db = getSupabaseAdmin();
    const row = await renameTaxonomy(db, "brands", tiendaId, id, name);

    return ok(toBrand(row as unknown as ProductBrandRow));
  });
}
