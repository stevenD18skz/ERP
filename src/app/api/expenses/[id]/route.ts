// GET    /api/expenses/:id
// PATCH  /api/expenses/:id
// DELETE /api/expenses/:id

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest, notFound } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";
import {
  Fields,
  readJson,
  compact,
  requireUuidParam,
  requireNonEmpty,
} from "@/lib/api/validate";
import { toExpense } from "@/lib/api/mappers";
import type { ExpenseRow } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = ["gasto", "entrada", "salida"] as const;

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del gasto");

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("tienda_id", tiendaId)
      .maybeSingle();
    if (error) throw fromPostgrest(error, "la consulta del gasto");
    if (!data) throw notFound("No existe un gasto con ese identificador");

    return ok(toExpense(data as ExpenseRow));
  });
}

export async function PATCH(request: NextRequest, context: Context) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del gasto");

    const body = await readJson(request);
    const f = new Fields(body);

    const patch = compact({
      date: f.date("date"),
      kind: f.oneOf("kind", KINDS),
      amount: f.number("amount", { min: 0 }),
      concept: f.string("concept", { max: 200 }),
      notes: f.string("notes", { allowEmpty: true, max: 2000 }),
    });
    f.check();
    requireNonEmpty(patch);

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("expenses")
      .update(patch)
      .eq("id", id)
      .eq("tienda_id", tiendaId)
      .select("*")
      .maybeSingle();
    if (error) throw fromPostgrest(error, "la actualización del gasto");
    if (!data) throw notFound("No existe un gasto con ese identificador");

    return ok(toExpense(data as ExpenseRow));
  });
}

export async function DELETE(request: NextRequest, context: Context) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);
    const { id } = await context.params;
    requireUuidParam(id, "El identificador del gasto");

    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("tienda_id", tiendaId)
      .select("id")
      .maybeSingle();
    if (error) throw fromPostgrest(error, "el borrado del gasto");
    if (!data) throw notFound("No existe un gasto con ese identificador");

    return ok({ id, deleted: true });
  });
}
