// Puerta de sesión: exige la cookie de tienda para todo menos lo público.
// Corre en Edge (runtime por defecto de Next), por eso session.ts usa
// crypto.subtle en vez de node:crypto — es lo único que hay en los dos lados.

import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { SIM_COOKIE } from "@/lib/simulation/cookie";

const PUBLIC_PAGES = new Set(["/", "/simulacion", "/login", "/signup", "/manual"]);
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/health"];

// El celular que hace de lector entra por acá desde otro navegador, sin la
// cookie de sesión de la tienda (el QR se apunta con el teléfono, no se
// comparte la sesión). Puede ser pública porque esa pantalla no lee ni escribe
// nada del negocio: abre la cámara y emite el código leído al canal de
// Realtime cuyo identificador va en la propia dirección, que es un UUID
// aleatorio e imposible de adivinar. Ver src/lib/phoneScanner.ts.
const PUBLIC_PAGE_PREFIXES = ["/scan"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname)) return true;
  return [...PUBLIC_PAGE_PREFIXES, ...PUBLIC_API_PREFIXES].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // La landing es la puerta de entrada, pero si ya hay sesión válida no tiene
  // caso mostrarla: se manda directo al dashboard de la tienda.
  if (pathname === "/") {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

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
