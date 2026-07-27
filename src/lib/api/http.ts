// Respuestas de la API. Todas tienen la misma forma:
//
//   éxito -> { "data": ..., "meta": { ... } }   (meta solo en los listados)
//   error -> { "error": { "message": "...", "code": "...", "details": ... } }
//
// El mensaje de error viene en español y está pensado para mostrarse tal cual
// en pantalla; el code es para que la aplicación pueda reaccionar distinto
// según el caso.

import { NextResponse } from "next/server";

import { ApiError, toApiError } from "./errors";

export type ListMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json(meta ? { data, meta } : { data }, { status });
}

export function created<T>(data: T, meta?: Record<string, unknown>) {
  return ok(data, meta, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(error: unknown) {
  const apiError: ApiError = toApiError(error);

  // Los 5xx son problemas del servidor, no del usuario: quedan en los logs
  // para poder revisarlos después en Vercel.
  if (apiError.status >= 500) {
    console.error(
      `[api] ${apiError.code} (${apiError.status}):`,
      apiError.message,
      apiError.details ?? "",
    );
  }

  return NextResponse.json(
    {
      error: {
        message: apiError.message,
        code: apiError.code,
        ...(apiError.details !== undefined
          ? { details: apiError.details }
          : {}),
      },
    },
    { status: apiError.status },
  );
}

// Envuelve el cuerpo de cada ruta para que ningún error se escape sin formato.
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    return fail(error);
  }
}

export function listMeta(
  page: number,
  limit: number,
  total: number | null,
): ListMeta {
  const count = total ?? 0;
  return {
    page,
    limit,
    total: count,
    pages: limit > 0 ? Math.max(1, Math.ceil(count / limit)) : 1,
  };
}
