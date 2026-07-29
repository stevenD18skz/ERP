// POST /api/auth/login   { email, password } -> cookie de sesión

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, ok } from "@/lib/api/http";
import { fromPostgrest, unauthorized } from "@/lib/api/errors";
import { Fields, readJson } from "@/lib/api/validate";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ILIKE sin comodines es un match exacto sin importar mayúsculas, pero % y _
// sí son comodines para ILIKE: si el correo los trae de verdad (no debería,
// pero por si acaso), hay que escaparlos para que no actúen como tal.
function ilikeExact(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const body = await readJson(request);
    const f = new Fields(body);
    const email = f.string("email", { required: true, max: 200 });
    const password = f.string("password", { required: true, max: 200 });
    f.check();

    const db = getSupabaseAdmin();
    const { data: tienda, error } = await db
      .from("tiendas")
      .select("id, nombre, dueno, email, password_hash")
      .ilike("email", ilikeExact(email!))
      .maybeSingle();
    if (error) throw fromPostgrest(error, "el inicio de sesión");

    if (!tienda || !verifyPassword(password!, tienda.password_hash)) {
      throw unauthorized("Correo o contraseña incorrectos");
    }

    const token = await createSessionToken({
      tiendaId: tienda.id,
      nombre: tienda.nombre,
      dueno: tienda.dueno,
      email: tienda.email,
    });

    const res = ok({
      nombre: tienda.nombre,
      dueno: tienda.dueno,
      email: tienda.email,
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return res;
  });
}
