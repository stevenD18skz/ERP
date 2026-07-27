// GET  /api/expenses   gastos y movimientos de caja
// POST /api/expenses   registra uno nuevo
//
// kind = "gasto"   plata que salió por consumo del negocio
//        "entrada" plata que entró a la caja por fuera de las ventas
//        "salida"  plata que salió de la caja
//
// Los 353 gastos de 2025 entraron con un concepto genérico porque el Excel
// solo guardaba el total del día. Son el mismo dinero que
// daily_closes.expenses_total: al sumar hay que usar una fuente o la otra.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok, created, listMeta } from "@/lib/api/http";
import { fromPostgrest } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";
import { Fields, readJson } from "@/lib/api/validate";
import { parseListQuery, enumParam, todayInBogota } from "@/lib/api/query";
import { toExpense } from "@/lib/api/mappers";
import type { ExpenseRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SORTABLE = ["date", "amount", "kind", "created_at"] as const;
const KINDS = ["gasto", "entrada", "salida"] as const;

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
      defaultSort: "date",
      defaultOrder: "desc",
    });

    const db = getSupabaseAdmin();
    let query = db
      .from("expenses")
      .select("*", { count: "exact" })
      .eq("tienda_id", tiendaId);

    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);

    const kind = enumParam(params.get("kind"), KINDS, "kind");
    if (kind) query = query.eq("kind", kind);

    if (q)
      query = query.or(
        [`concept.ilike.%${q}%`, `notes.ilike.%${q}%`].join(","),
      );

    const { data, error, count } = await query
      .order(sort, { ascending })
      .order("created_at", { ascending: false })
      .range(offset, rangeEnd);
    if (error) throw fromPostgrest(error, "el listado de gastos");

    return ok(
      (data as ExpenseRow[]).map(toExpense),
      listMeta(page, limit, count),
    );
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const body = await readJson(request);
    const f = new Fields(body);

    const date = f.date("date");
    const kind = f.oneOf("kind", KINDS);
    const amount = f.number("amount", { required: true, min: 0 });
    const concept = f.string("concept", { required: true, max: 200 });
    const notes = f.string("notes", { allowEmpty: true, max: 2000 });
    f.check();

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("expenses")
      .insert({
        tienda_id: tiendaId,
        date: date ?? todayInBogota(),
        kind: kind ?? "gasto",
        amount,
        concept,
        notes: notes ?? "",
      })
      .select("*")
      .single();
    if (error) throw fromPostgrest(error, "el registro del gasto");

    return created(toExpense(data as ExpenseRow));
  });
}
