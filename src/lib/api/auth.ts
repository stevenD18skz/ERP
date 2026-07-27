// Lee la tienda de la sesión, ya verificada por middleware.ts (que inyecta
// x-tienda-id). El 401 de acá es solo una defensa extra por si algo pega
// directo a una ruta sin pasar por el middleware.

import type { NextRequest } from "next/server";

import { unauthorized } from "./errors";

export function requireTiendaId(request: NextRequest): string {
  const tiendaId = request.headers.get("x-tienda-id");
  if (!tiendaId) throw unauthorized();
  return tiendaId;
}
