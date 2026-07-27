// Puerta de sesión: exige la cookie de tienda para todo menos lo público.
// Corre en Edge (runtime por defecto de Next), por eso session.ts usa
// crypto.subtle en vez de node:crypto — es lo único que hay en los dos lados.

import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { SIM_COOKIE } from "@/lib/simulation/cookie";

const PUBLIC_PAGES = new Set(["/", "/simulacion", "/login", "/signup", "/manual"]);
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/health"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) return true;
  return PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  // La simulación es datos de mentira en sessionStorage: nunca llama a /api,
  // así que puede navegar las pantallas sin sesión real. Esa cookie la pone
  // src/lib/simulation/store.ts al encender la simulación.
  if (!pathname.startsWith("/api") && request.cookies.get(SIM_COOKIE)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: { message: "No autenticado", code: "unauthenticated" } },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Las rutas de /api leen la tienda de este header en vez de volver a
  // verificar la cookie: src/lib/api/auth.ts -> requireTiendaId().
  const headers = new Headers(request.headers);
  headers.set("x-tienda-id", session.tiendaId);
  headers.set("x-tienda-nombre", session.nombre);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
