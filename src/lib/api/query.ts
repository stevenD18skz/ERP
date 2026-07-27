// Lectura de los parámetros de consulta (?page=2&q=arroz&from=2025-01-01...)
// que comparten todos los listados de la API.

import { badRequest } from "./errors";
import { isDateOnly } from "./validate";

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 500;

export type ListQuery = {
  page: number;
  limit: number;
  /** Índices para .range() de supabase-js. */
  offset: number;
  rangeEnd: number;
  q: string;
  from: string | null;
  to: string | null;
  sort: string;
  ascending: boolean;
  params: URLSearchParams;
};

type ListQueryOptions = {
  /** Columnas por las que se deja ordenar. Cualquier otra devuelve 400. */
  sortable: readonly string[];
  defaultSort: string;
  defaultOrder?: "asc" | "desc";
  defaultLimit?: number;
};

// PostgREST separa los filtros con comas y agrupa con paréntesis: si el texto
// buscado los trae, la consulta se rompe o termina filtrando por otra cosa.
// Los % y _ también se quitan porque en ILIKE son comodines.
export function sanitizeFilter(value: string): string {
  return value
    .replace(/[,()%_\\*"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseListQuery(
  request: Request,
  options: ListQueryOptions,
): ListQuery {
  const params = new URL(request.url).searchParams;

  const page = Math.max(1, toInt(params.get("page"), 1, "page"));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(
      1,
      toInt(
        params.get("limit"),
        options.defaultLimit ?? DEFAULT_LIMIT,
        "limit",
      ),
    ),
  );

  const sort = params.get("sort") ?? options.defaultSort;
  if (!options.sortable.includes(sort)) {
    throw badRequest(
      `No se puede ordenar por "${sort}". Opciones: ${options.sortable.join(", ")}`,
    );
  }

  const order = (
    params.get("order") ??
    options.defaultOrder ??
    "desc"
  ).toLowerCase();
  if (order !== "asc" && order !== "desc") {
    throw badRequest('El parámetro "order" solo acepta asc o desc');
  }

  const from = dateParam(params.get("from"), "from");
  const to = dateParam(params.get("to"), "to");
  if (from && to && from > to) {
    throw badRequest(
      'El rango de fechas está al revés: "from" es posterior a "to"',
    );
  }

  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
    rangeEnd: offset + limit - 1,
    q: sanitizeFilter(params.get("q") ?? ""),
    from,
    to,
    sort,
    ascending: order === "asc",
    params,
  };
}

function toInt(raw: string | null, fallback: number, name: string): number {
  if (raw === null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n))
    throw badRequest(`El parámetro "${name}" debe ser un número entero`);
  return n;
}

export function dateParam(raw: string | null, name: string): string | null {
  if (!raw || raw.trim() === "") return null;
  const value = raw.trim();
  if (!isDateOnly(value)) {
    throw badRequest(`El parámetro "${name}" debe tener el formato AAAA-MM-DD`);
  }
  return value;
}

export function boolParam(raw: string | null): boolean | null {
  if (raw === null || raw.trim() === "") return null;
  const value = raw.trim().toLowerCase();
  if (["true", "1", "si", "sí"].includes(value)) return true;
  if (["false", "0", "no"].includes(value)) return false;
  return null;
}

export function numberParam(raw: string | null, name: string): number | null {
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  if (Number.isNaN(n))
    throw badRequest(`El parámetro "${name}" debe ser un número`);
  return n;
}

export function enumParam<T extends string>(
  raw: string | null,
  values: readonly T[],
  name: string,
): T | null {
  if (!raw || raw.trim() === "") return null;
  const value = raw.trim() as T;
  if (!values.includes(value)) {
    throw badRequest(
      `El parámetro "${name}" solo acepta: ${values.join(", ")}`,
    );
  }
  return value;
}

// El día en Colombia, no en UTC: a las 7 de la noche acá ya es el día
// siguiente en UTC y el cierre del día saldría cambiado.
export function todayInBogota(): string {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Convierte un rango de fechas (AAAA-MM-DD) a marcas de tiempo UTC para poder
// filtrar columnas timestamptz como sale_date u order_date.
export function dayRangeToUtc(from: string | null, to: string | null) {
  return {
    startUtc: from ? new Date(`${from}T00:00:00-05:00`).toISOString() : null,
    endUtc: to ? new Date(`${to}T23:59:59.999-05:00`).toISOString() : null,
  };
}
