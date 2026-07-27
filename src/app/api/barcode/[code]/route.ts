// GET /api/barcode/:code   ficha pública de un producto según su código de barras
//
// Ojo con la diferencia: `GET /api/products?barcode=` busca en el catálogo del
// negocio, o sea en lo que ya está registrado acá. Esta ruta busca AFUERA, en
// las bases abiertas de Open Facts, y sirve para llenar el formulario cuando el
// producto todavía no existe en la tienda. Nunca escribe nada.
//
// Va por el servidor y no directo desde el navegador por dos razones: esas
// bases piden un User-Agent que identifique a la aplicación (el navegador no
// deja ponerlo) y así la respuesta queda cacheada y con el mismo formato que el
// resto de la API.

import type { NextRequest } from "next/server";

import { handle, ok } from "@/lib/api/http";
import { badRequest, notFound } from "@/lib/api/errors";
import { lookupBarcode } from "@/lib/barcode/openFacts";

export const runtime = "nodejs";

type Context = { params: Promise<{ code: string }> };

// EAN-8, UPC-A (12), EAN-13 y los ITF-14 de las cajas de proveedor.
const BARCODE_RE = /^\d{8,14}$/;

export async function GET(_request: NextRequest, context: Context) {
  return handle(async () => {
    const { code } = await context.params;
    const clean = decodeURIComponent(code ?? "").trim();

    if (!BARCODE_RE.test(clean)) {
      throw badRequest(
        "Un código de barras son entre 8 y 14 dígitos, sin letras ni espacios",
      );
    }

    const found = await lookupBarcode(clean);

    // Que no esté es un desenlace normal, no una falla: los catálogos abiertos
    // no tienen lo local ni lo que se vende a granel. Se responde 404 para que
    // la pantalla pueda ofrecer llenar el producto a mano.
    if (!found) {
      throw notFound(
        `Ningún catálogo público tiene el código ${clean}. Toca llenar el producto a mano.`,
      );
    }

    return ok(found);
  });
}
