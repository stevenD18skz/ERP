// GET  /api/sales   ventas registradas en la app, con sus líneas
// POST /api/sales   registra una venta completa (encabezado + líneas + stock)
//
// Las ventas de 2025 no están aquí: el Excel solo anotaba un total por día y
// eso vive en /api/daily-closes. Esta tabla arranca vacía a propósito.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok, created, listMeta } from "@/lib/api/http";
import { fromPostgrest, badRequest } from "@/lib/api/errors";
import { Fields, readJson } from "@/lib/api/validate";
import {
  parseListQuery,
  boolParam,
  enumParam,
  dayRangeToUtc,
  sanitizeFilter,
} from "@/lib/api/query";
import { toSale, SALE_SELECT } from "@/lib/api/mappers";
import type { SaleRow } from "@/types/database";
import type { PaymentMethod } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SORTABLE = ["sale_date", "total_amount", "gain", "created_at"] as const;
const PAYMENT_METHODS = [
  "efectivo",
  "tarjeta",
  "transferencia",
  "fiado",
] as const;
const DISCOUNT_TYPES = ["pct", "amount"] as const;

export async function GET(request: NextRequest) {
  return handle(async () => {
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
      defaultSort: "sale_date",
      defaultOrder: "desc",
    });

    const db = getSupabaseAdmin();
    let query = db.from("sales").select(SALE_SELECT, { count: "exact" });

    const { startUtc, endUtc } = dayRangeToUtc(from, to);
    if (startUtc) query = query.gte("sale_date", startUtc);
    if (endUtc) query = query.lte("sale_date", endUtc);

    const method = enumParam(
      params.get("payment_method"),
      PAYMENT_METHODS,
      "payment_method",
    );
    if (method) query = query.eq("payment_method", method);

    // Por defecto salen todas, anuladas incluidas: la venta anulada es parte
    // del historial. Con ?voided=false se esconden.
    const voided = boolParam(params.get("voided"));
    if (voided !== null) query = query.eq("voided", voided);

    // Búsqueda por cliente, para revisar los fiados de alguien.
    if (q) query = query.ilike("client_name", `%${q}%`);

    const client = params.get("client");
    if (client)
      query = query.ilike("client_name", `%${sanitizeFilter(client)}%`);

    const { data, error, count } = await query
      .order(sort, { ascending })
      .order("created_at", { referencedTable: "items", ascending: true })
      .range(offset, rangeEnd);
    if (error) throw fromPostgrest(error, "el listado de ventas");

    return ok((data as SaleRow[]).map(toSale), listMeta(page, limit, count));
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const body = await readJson(request);

    // Se aceptan las dos formas:
    //   { sale: { ... }, products: [ ... ] }
    //   { sale_date, payment_method, ..., products: [ ... ] }
    // La segunda es la que arma hoy la pantalla de ventas.
    const header =
      body.sale && typeof body.sale === "object" && !Array.isArray(body.sale)
        ? (body.sale as Record<string, unknown>)
        : body;
    const rawLines =
      body.products ?? body.items ?? header.products ?? header.items;

    const f = new Fields(header);
    const saleDate = f.datetime("sale_date");
    const paymentMethod = f.oneOf("payment_method", PAYMENT_METHODS);
    const clientName = f.string("client_name", { nullable: true, max: 160 });
    const voided = f.boolean("voided");
    const adjustStock = f.boolean("adjust_stock");

    if (!Array.isArray(rawLines) || rawLines.length === 0) {
      f.add("products", "La venta necesita al menos una línea de producto");
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
          sale_price: lf.number("sale_price", { min: 0 }),
          discount_type:
            lf.oneOf("discount_type", DISCOUNT_TYPES, { nullable: true }) ??
            null,
          discount_value: lf.number("discount_value", { min: 0 }) ?? 0,
        };
        for (const [field, message] of Object.entries(lf.errors)) {
          f.add(`products[${index}].${field}`, message);
        }
        return line;
      },
    );

    if (paymentMethod === "fiado" && !clientName) {
      f.add(
        "client_name",
        "Una venta a crédito necesita el nombre del cliente",
      );
    }
    f.check();

    const db = getSupabaseAdmin();

    // El total y la ganancia los calcula la función SQL a partir de las líneas
    // y del costo del catálogo. No se toman del cliente: es plata.
    const { data: rpcData, error: rpcError } = await db.rpc("create_sale", {
      p_sale: {
        sale_date: saleDate ?? null,
        payment_method: paymentMethod ?? "efectivo",
        client_name: clientName ?? null,
        voided: voided ?? false,
      },
      p_items: items,
      p_adjust_stock: adjustStock ?? true,
    });
    if (rpcError) throw fromPostgrest(rpcError, "el registro de la venta");

    const saleRow = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!saleRow?.id) throw badRequest("La venta no se pudo registrar");

    const { data, error } = await db
      .from("sales")
      .select(SALE_SELECT)
      .eq("id", saleRow.id)
      .single();
    if (error)
      throw fromPostgrest(error, "la lectura de la venta recién creada");

    return created(toSale(data as SaleRow));
  });
}
