// POST /api/products/photo
//
// Sube la foto que la propia tienda toma o elige al crear/editar un
// producto (distinta de la que ya trae un catálogo público, que llega como
// URL y no pasa por acá). Se guarda en el bucket "product-photos" y se
// devuelve la URL pública, que es lo que el formulario termina guardando en
// products.photo — así ese campo sigue siendo siempre una URL corta, nunca
// la imagen completa.

import type { NextRequest } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabase/server";
import { handle, created } from "@/lib/api/http";
import { ApiError, badRequest } from "@/lib/api/errors";
import { requireTiendaId } from "@/lib/api/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: NextRequest) {
  return handle(async () => {
    const tiendaId = requireTiendaId(request);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw badRequest("Falta el archivo de la foto");
    }
    const ext = EXT_BY_MIME[file.type];
    if (!ext) {
      throw badRequest("La foto debe ser JPEG, PNG, WEBP o GIF");
    }
    if (file.size > MAX_BYTES) {
      throw badRequest("La foto pesa más de 5MB");
    }

    const path = `${tiendaId}/${crypto.randomUUID()}.${ext}`;
    const db = getSupabaseAdmin();
    const { error: uploadError } = await db.storage
      .from("product-photos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      throw new ApiError(
        502,
        `No se pudo subir la foto: ${uploadError.message}`,
        "photo_upload_failed",
      );
    }

    const { data } = db.storage.from("product-photos").getPublicUrl(path);
    return created({ url: data.publicUrl });
  });
}
