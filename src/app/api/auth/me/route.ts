// GET /api/auth/me   tienda de la sesión actual, o 401

import type { NextRequest } from "next/server";

import { handle, ok } from "@/lib/api/http";
import { unauthorized } from "@/lib/api/errors";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);
    if (!session) throw unauthorized("No hay una sesión activa");

    return ok({ nombre: session.nombre, dueno: session.dueno });
  });
}
