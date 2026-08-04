// PATCH /api/orders/suppliers/:id
// Renombra un proveedor existente. Los pedidos ya creados no se tocan: su
// columna orders.supplier guarda el nombre tal como estaba el día del
// pedido (igual que order_items.product_name), así que un historial viejo no
// cambia de texto solo porque el proveedor se haya renombrado después.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { requireTiendaId } from "@/lib/api/auth";
import { Fields, readJson, requireUuidParam } from "@/lib/api/validate";
import { renameTaxonomy } from "@/lib/api/taxonomy";
import { toSupplier } from "@/lib/api/mappers";
import type { OrderSupplierRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del proveedor");

    const body = await readJson(request);
    const f = new Fields(body);
    const name = f.string("name", { required: true, max: 160 });
    f.check();

    const db = getSupabaseAdmin();
    const row = await renameTaxonomy(db, "suppliers", tiendaId, id, name);

    return ok(toSupplier(row as unknown as OrderSupplierRow));
  });
}
