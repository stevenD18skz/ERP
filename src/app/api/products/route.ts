// GET  /api/products   listado del catálogo, con búsqueda, filtros y páginas
// POST /api/products   crea un producto

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok, created, listMeta } from "@/lib/api/http";
import { ApiError, fromPostgrest } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";
import { Fields, readJson } from "@/lib/api/validate";
import {
  parseListQuery,
  boolParam,
  numberParam,
  sanitizeFilter,
} from "@/lib/api/query";
import { toProduct } from "@/lib/api/mappers";
import { resolveTaxonomyId, readProductRow } from "@/lib/api/taxonomy";
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
  "brand",
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
    // Se lee de la vista y no de la tabla: trae el nombre de la categoría y de
    // la marca ya resueltos, que es por lo que se busca, se filtra y se ordena.
    let query = db
      .from("v_products")
      .select("*", { count: "exact" })
      .eq("tienda_id", tiendaId);

    if (q) {
      query = query.or(
        [
          `name.ilike.%${q}%`,
          `sku.ilike.%${q}%`,
          `barcode.ilike.%${q}%`,
          `category.ilike.%${q}%`,
          `brand.ilike.%${q}%`,
        ].join(","),
      );
    }

    // Por nombre y no por id: es lo que se ve en pantalla y lo que se puede
    // escribir a mano en una URL.
    const category = params.get("category");
    if (category) query = query.eq("category", category);

    const brand = params.get("brand");
    if (brand) query = query.eq("brand", brand);

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
    // El SKU es opcional: en una tienda de barrio se busca por nombre y se
    // cobra por código de barras. Sirve para lo que no trae código impreso
    // (granel, reempaque) y para que el importador de CSV reconozca una fila
    // ya cargada, así que se guarda si lo escriben y se deja vacío si no.
    const sku = f.string("sku", { max: 60, allowEmpty: true });
    const price = f.number("price", { required: true, min: 0 });
    const costPrice = f.number("cost_price", { min: 0 });
    const barcode = f.string("barcode", { max: 60, allowEmpty: true });
    const photo = f.string("photo", { nullable: true, max: 2000 });
    const stock = f.number("stock", { min: 0 });
    // La categoría y la marca se aceptan por id (cuando se eligieron de la
    // lista) o por nombre. El nombre que no existe todavía se crea junto con el
    // producto: para quien registra es un solo "Guardar".
    const category = f.string("category", { max: 120, allowEmpty: true });
    const categoryId = f.uuid("category_id", { nullable: true });
    const brand = f.string("brand", { max: 120, allowEmpty: true });
    const brandId = f.uuid("brand_id", { nullable: true });
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
    const resolvedCategory = await resolveTaxonomyId(db, "categories", tiendaId, {
      id: categoryId,
      name: category,
    });
    const resolvedBrand = await resolveTaxonomyId(db, "brands", tiendaId, {
      id: brandId,
      name: brand,
    });

    const { data, error } = await db
      .from("products")
      .insert({
        tienda_id: tiendaId,
        name,
        sku: sku ?? "",
        price,
        cost_price: costPrice ?? 0,
        cost_is_estimated: estimated,
        barcode: barcode ?? "",
        photo: photo ?? null,
        stock: stock ?? 0,
        category_id: resolvedCategory ?? null,
        brand_id: resolvedBrand ?? null,
        description: description ?? "",
      })
      .select("id")
      .single();

    if (error) throw fromPostgrest(error, "la creación del producto");

    // Se relee de la vista para devolver los nombres de la categoría y la
    // marca, no solo sus ids: es lo que la pantalla pinta.
    const row = await readProductRow(db, data.id as string, tiendaId);
    if (!row) {
      throw new ApiError(
        500,
        "El producto se creó pero no se pudo volver a leer. Recarga el catálogo.",
        "read_after_write",
      );
    }

    return created(toProduct(row));
  });
}
