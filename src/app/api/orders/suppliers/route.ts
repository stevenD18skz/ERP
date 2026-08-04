// GET /api/orders/suppliers
// Los proveedores de la tienda, con cuántos pedidos activos tiene cada uno.
// Sirve para armar el select del encabezado del pedido sin traerse todo el
// historial.
//
// Los proveedores son una tabla propia (supabase/sql/01_schema.sql), así que
// acá aparecen también los que todavía no tienen ningún pedido.
//
// Next resuelve primero los segmentos fijos, así que esta ruta gana sobre
// /api/orders/[id] y "suppliers" nunca llega como id.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";
import { toSupplier } from "@/lib/api/mappers";
import type { OrderSupplierRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("v_order_suppliers")
      .select("*")
      .eq("tienda_id", tiendaId)
      .order("supplier", { ascending: true });
    if (error) throw fromPostgrest(error, "el listado de proveedores");

    return ok((data as OrderSupplierRow[]).map(toSupplier));
  });
}
