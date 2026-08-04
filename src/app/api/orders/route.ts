// GET  /api/orders   pedidos a proveedores, con sus líneas
// POST /api/orders   crea un pedido
//
// Crear el pedido NO toca el inventario: la mercancía entra cuando se recibe
// (POST /api/orders/:id/receive).
//
// Las compras de 2025 tampoco están aquí: el Excel guardaba un total diario
// sin proveedor ni detalle, y eso vive en daily_closes.purchases_total.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok, created, listMeta } from "@/lib/api/http";
import { fromPostgrest, badRequest } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";
import { Fields, readJson } from "@/lib/api/validate";
import {
  parseListQuery,
  enumParam,
  boolParam,
  dayRangeToUtc,
  sanitizeFilter,
  todayInBogota,
} from "@/lib/api/query";
import { toOrder, ORDER_SELECT } from "@/lib/api/mappers";
import { resolveTaxonomyId } from "@/lib/api/taxonomy";
import type { OrderRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SORTABLE = [
  "order_date",
  "expected_delivery",
  "total_amount",
  "supplier",
  "created_at",
] as const;
const STATUSES = ["pendiente", "recibido", "cancelado"] as const;

export async function GET(request: NextRequest) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const {
      sort,
      ascending,
      page,
      limit,
      offset,
      rangeEnd,
      from,
      to,
      params,
      q,
    } = parseListQuery(request, {
      sortable: SORTABLE,
      defaultSort: "order_date",
      defaultOrder: "desc",
    });

    const db = getSupabaseAdmin();
    let query = db
      .from("orders")
      .select(ORDER_SELECT, { count: "exact" })
      .eq("tienda_id", tiendaId);

    const { startUtc, endUtc } = dayRangeToUtc(from, to);
    if (startUtc) query = query.gte("order_date", startUtc);
    if (endUtc) query = query.lte("order_date", endUtc);

    const status = enumParam(params.get("status"), STATUSES, "status");
    if (status) query = query.eq("status", status);

    const supplier = params.get("supplier") ?? q;
    if (supplier)
      query = query.ilike("supplier", `%${sanitizeFilter(supplier)}%`);

    // ?late=true -> pendientes cuya fecha de entrega ya pasó.
    if (boolParam(params.get("late")) === true) {
      query = query
        .eq("status", "pendiente")
        .lt("expected_delivery", todayInBogota());
    }

    const { data, error, count } = await query
      .order(sort, { ascending, nullsFirst: false })
      .order("created_at", { referencedTable: "items", ascending: true })
      .range(offset, rangeEnd);
    if (error) throw fromPostgrest(error, "el listado de pedidos");

    return ok((data as OrderRow[]).map(toOrder), listMeta(page, limit, count));
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const body = await readJson(request);

    const header =
      body.order && typeof body.order === "object" && !Array.isArray(body.order)
        ? (body.order as Record<string, unknown>)
        : body;
    const rawLines =
      body.products ?? body.items ?? header.products ?? header.items;

    const f = new Fields(header);
    const orderDate = f.datetime("order_date");
    // El proveedor se acepta por id (cuando se eligió de la lista) o por
    // nombre. El nombre que no existe todavía se crea junto con el pedido:
    // para quien registra es un solo "Registrar pedido" (mismo mecanismo que
    // categoría/marca de productos, ver resolveTaxonomyId).
    const supplier = f.string("supplier", { required: true, max: 160 });
    const supplierId = f.uuid("supplier_id", { nullable: true });
    const expectedDelivery = f.date("expected_delivery", { nullable: true });
    const notes = f.string("notes", { allowEmpty: true, max: 2000 });
    const status = f.oneOf("status", STATUSES);
    const attachment = f.string("attachment", { nullable: true, max: 2000 });

    if (!Array.isArray(rawLines) || rawLines.length === 0) {
      f.add("products", "El pedido necesita al menos una línea de producto");
    }

    const items = (Array.isArray(rawLines) ? rawLines : []).map(
      (raw, index) => {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
          f.add(`products[${index}]`, "Cada línea debe ser un objeto");
          return null;
        }
        const lf = new Fields(raw as Record<string, unknown>);
        const line = {
          product_id: lf.uuid("product_id", { nullable: true }) ?? null,
          product: lf.string("product", { max: 200, nullable: true }) ?? null,
          quantity: lf.number("quantity", { required: true, min: 0.001 }),
          unit_cost: lf.number("unit_cost", { min: 0 }),
        };
        for (const [field, message] of Object.entries(lf.errors)) {
          f.add(`products[${index}].${field}`, message);
        }
        return line;
      },
    );
    f.check();

    const db = getSupabaseAdmin();
    const resolvedSupplierId = await resolveTaxonomyId(db, "suppliers", tiendaId, {
      id: supplierId,
      name: supplier,
    });

    const { data: rpcData, error: rpcError } = await db.rpc("create_order", {
      p_order: {
        order_date: orderDate ?? null,
        supplier,
        supplier_id: resolvedSupplierId ?? null,
        expected_delivery: expectedDelivery ?? null,
        notes: notes ?? "",
        status: status ?? "pendiente",
        attachment: attachment ?? null,
      },
      p_items: items,
      p_tienda_id: tiendaId,
    });
    if (rpcError) throw fromPostgrest(rpcError, "la creación del pedido");

    const orderRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!orderRow?.id) throw badRequest("El pedido no se pudo crear");

    const { data, error } = await db
      .from("orders")
      .select(ORDER_SELECT)
      .eq("id", orderRow.id)
      .eq("tienda_id", tiendaId)
      .single();
    if (error)
      throw fromPostgrest(error, "la lectura del pedido recién creado");

    return created(toOrder(data as OrderRow));
  });
}
