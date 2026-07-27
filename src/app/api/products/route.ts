// GET  /api/products   listado del catálogo, con búsqueda, filtros y páginas
// POST /api/products   crea un producto

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok, created, listMeta } from "@/lib/api/http";
import { fromPostgrest } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";
import { Fields, readJson } from "@/lib/api/validate";
import {
  parseListQuery,
  boolParam,
  numberParam,
  sanitizeFilter,
} from "@/lib/api/query";
import { toProduct } from "@/lib/api/mappers";
import type { ProductRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SORTABLE = [
  "name",
  "sku",
  "price",
  "cost_price",
  "stock",
  "category",
  "created_at",
] as const;

export async function GET(request: NextRequest) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const { q, sort, ascending, page, limit, offset, rangeEnd, params } =
      parseListQuery(request, {
        sortable: SORTABLE,
        defaultSort: "name",
        defaultOrder: "asc",
      });

    const db = getSupabaseAdmin();
    let query = db
      .from("products")
      .select("*", { count: "exact" })
      .eq("tienda_id", tiendaId);

    if (q) {
      query = query.or(
        [
          `name.ilike.%${q}%`,
          `sku.ilike.%${q}%`,
          `barcode.ilike.%${q}%`,
          `category.ilike.%${q}%`,
        ].join(","),
      );
    }

    const category = params.get("category");
    if (category) query = query.eq("category", category);

    // Búsqueda exacta por código de barras, para el lector del punto de venta.
    const barcode = params.get("barcode");
    if (barcode) query = query.eq("barcode", sanitizeFilter(barcode));

    // ?lowStock=10 -> los que ya hay que reponer.
    const lowStock = numberParam(params.get("lowStock"), "lowStock");
    if (lowStock !== null) query = query.lte("stock", lowStock);

    const inStock = boolParam(params.get("inStock"));
    if (inStock === true) query = query.gt("stock", 0);
    if (inStock === false) query = query.lte("stock", 0);

    // ?estimatedCost=true -> los que todavía tienen el costo calculado con el
    // margen del 19% y hay que confirmar contra factura.
    const estimatedCost = boolParam(params.get("estimatedCost"));
    if (estimatedCost !== null)
      query = query.eq("cost_is_estimated", estimatedCost);

    const { data, error, count } = await query
      .order(sort, { ascending })
      .range(offset, rangeEnd);
    if (error) throw fromPostgrest(error, "el listado de productos");

    return ok(
      (data as ProductRow[]).map(toProduct),
      listMeta(page, limit, count),
    );
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const body = await readJson(request);
    const f = new Fields(body);

    const name = f.string("name", { required: true, max: 200 });
    const sku = f.string("sku", { required: true, max: 60 });
    const price = f.number("price", { required: true, min: 0 });
    const costPrice = f.number("cost_price", { min: 0 });
    const barcode = f.string("barcode", { max: 60, allowEmpty: true });
    const photo = f.string("photo", { nullable: true, max: 2000 });
    const stock = f.number("stock", { min: 0 });
    const category = f.string("category", { max: 120, allowEmpty: true });
    const description = f.string("description", {
      allowEmpty: true,
      max: 4000,
    });
    const costIsEstimated = f.boolean("cost_is_estimated");
    f.check();

    // Un costo escrito a mano es un costo real: deja de estar estimado en el
    // 81% del precio, salvo que quien llama diga explícitamente lo contrario.
    const estimated =
      costIsEstimated ?? (costPrice === undefined ? true : false);

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("products")
      .insert({
        tienda_id: tiendaId,
        name,
        sku,
        price,
        cost_price: costPrice ?? 0,
        cost_is_estimated: estimated,
        barcode: barcode ?? "",
        photo: photo ?? null,
        stock: stock ?? 0,
        category: category || "Sin categoría",
        description: description ?? "",
      })
      .select("*")
      .single();

    if (error) throw fromPostgrest(error, "la creación del producto");

    return created(toProduct(data as ProductRow));
  });
}
