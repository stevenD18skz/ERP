// Fetch al /api real desde el navegador. Mismo patrón que ya usa
// src/services/barcode.service.js: pega, lee el sobre {data}/{error} y tira
// un Error con el mensaje en español si algo salió mal.

function buildQuery(params: Record<string, unknown> = {}): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  const text = qs.toString();
  return text ? `?${text}` : "";
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.error?.message ?? "No se pudo completar la operación");
  }
  return body as { data: unknown; meta?: { pages: number } };
}

// El servidor limita cada página a 500 filas (MAX_LIMIT en src/lib/api/query.ts)
// y expenses ya tiene más de eso, así que un listado completo necesita más de
// una página. Las pantallas siguen filtrando/paginando en el navegador igual
// que con el mock, así que se les entrega la colección completa.
export async function apiFetchAll<T>(
  path: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  const limit = (params.limit as number | undefined) ?? 500;

  for (;;) {
    const body = await apiFetch(
      `${path}${buildQuery({ ...params, page, limit })}`,
    );
    results.push(...((body.data as T[]) ?? []));
    const pages = body.meta?.pages ?? 1;
    if (page >= pages) break;
    page += 1;
  }

  return results;
}
