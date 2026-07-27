// Validación de los cuerpos que llegan a la API.
//
// La idea es juntar TODOS los errores del formulario y devolverlos de una vez
// en un 422 con { details: { campo: "qué pasó" } }, en vez de ir rebotando la
// petición de a un error por vez.
//
//   const body = await readJson(request);
//   const f = new Fields(body);
//   const name = f.string("name", { required: true, max: 200 });
//   const price = f.number("price", { required: true, min: 0 });
//   f.check();   // <- si hubo errores, lanza el 422 y no sigue

import { ApiError, badRequest, invalidPayload } from "./errors";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isUuid = (value: unknown): boolean =>
  typeof value === "string" && UUID_RE.test(value);
export const isDateOnly = (value: unknown): boolean =>
  typeof value === "string" && DATE_RE.test(value);

export async function readJson(
  request: Request,
): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    throw badRequest("El cuerpo de la petición no es JSON válido");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw badRequest("El cuerpo de la petición debe ser un objeto JSON");
  }
  return parsed as Record<string, unknown>;
}

type BaseOpts = { required?: boolean; nullable?: boolean };
type StringOpts = BaseOpts & {
  max?: number;
  allowEmpty?: boolean;
  trim?: boolean;
};
type NumberOpts = BaseOpts & { min?: number; max?: number; integer?: boolean };
type ArrayOpts = BaseOpts & { min?: number; max?: number };

export class Fields {
  readonly errors: Record<string, string> = {};

  constructor(private readonly body: Record<string, unknown>) {}

  has(name: string): boolean {
    return (
      Object.prototype.hasOwnProperty.call(this.body, name) &&
      this.body[name] !== undefined
    );
  }

  private fail(name: string, message: string): undefined {
    this.errors[name] = message;
    return undefined;
  }

  // Devuelve:
  //   { skip: true }              -> el campo no venía; quien llama devuelve undefined
  //   { skip: true, value: null } -> venía en null y está permitido
  private guard(name: string, opts: BaseOpts) {
    const value = this.body[name];
    if (value === undefined) {
      if (opts.required) this.fail(name, "Es obligatorio");
      return { skip: true as const, value: undefined };
    }
    if (value === null) {
      if (opts.nullable) return { skip: true as const, value: null };
      this.fail(name, "No puede quedar vacío");
      return { skip: true as const, value: undefined };
    }
    return { skip: false as const, value };
  }

  string(name: string, opts: StringOpts = {}): string | null | undefined {
    const g = this.guard(name, opts);
    if (g.skip) return g.value as null | undefined;

    if (typeof g.value !== "string" && typeof g.value !== "number") {
      return this.fail(name, "Debe ser texto");
    }
    const text = opts.trim === false ? String(g.value) : String(g.value).trim();

    if (!text && !opts.allowEmpty) {
      if (opts.nullable) return null;
      return this.fail(name, "No puede quedar vacío");
    }
    if (opts.max && text.length > opts.max) {
      return this.fail(name, `No puede pasar de ${opts.max} caracteres`);
    }
    return text;
  }

  number(name: string, opts: NumberOpts = {}): number | null | undefined {
    const g = this.guard(name, opts);
    if (g.skip) return g.value as null | undefined;

    if (typeof g.value === "string" && g.value.trim() === "") {
      if (opts.nullable) return null;
      return this.fail(name, "No puede quedar vacío");
    }
    const n = Number(g.value);
    if (
      typeof g.value === "boolean" ||
      Number.isNaN(n) ||
      !Number.isFinite(n)
    ) {
      return this.fail(name, "Debe ser un número");
    }
    if (opts.integer && !Number.isInteger(n)) {
      return this.fail(name, "Debe ser un número entero");
    }
    if (opts.min !== undefined && n < opts.min) {
      return this.fail(name, `No puede ser menor que ${opts.min}`);
    }
    if (opts.max !== undefined && n > opts.max) {
      return this.fail(name, `No puede ser mayor que ${opts.max}`);
    }
    return n;
  }

  boolean(name: string, opts: BaseOpts = {}): boolean | null | undefined {
    const g = this.guard(name, opts);
    if (g.skip) return g.value as null | undefined;

    if (typeof g.value === "boolean") return g.value;
    if (g.value === "true") return true;
    if (g.value === "false") return false;
    return this.fail(name, "Debe ser true o false");
  }

  oneOf<T extends string>(
    name: string,
    values: readonly T[],
    opts: BaseOpts = {},
  ): T | null | undefined {
    const g = this.guard(name, opts);
    if (g.skip) return g.value as null | undefined;

    const text = String(g.value).trim();
    if (!(values as readonly string[]).includes(text)) {
      return this.fail(name, `Solo se acepta: ${values.join(", ")}`);
    }
    return text as T;
  }

  // Fecha sin hora, tal como la manda un <input type="date">: "2025-12-31".
  date(name: string, opts: BaseOpts = {}): string | null | undefined {
    const g = this.guard(name, opts);
    if (g.skip) return g.value as null | undefined;

    const text = String(g.value).trim();
    if (!text && opts.nullable) return null;
    if (!DATE_RE.test(text)) {
      return this.fail(name, "Debe tener el formato AAAA-MM-DD");
    }
    const [y, m, d] = text.split("-").map(Number);
    const parsed = new Date(Date.UTC(y, m - 1, d));
    if (
      parsed.getUTCFullYear() !== y ||
      parsed.getUTCMonth() !== m - 1 ||
      parsed.getUTCDate() !== d
    ) {
      return this.fail(name, "No es una fecha real");
    }
    return text;
  }

  // Fecha con hora. Se guarda como ISO en UTC.
  // Si llega solo la fecha se toma como medianoche en Colombia (UTC-5) y no en
  // UTC: si no, "2025-12-31" quedaría guardado como el 30 a las 7 de la noche
  // y aparecería en el día equivocado.
  datetime(name: string, opts: BaseOpts = {}): string | null | undefined {
    const g = this.guard(name, opts);
    if (g.skip) return g.value as null | undefined;

    const text = String(g.value).trim();
    const normalized = DATE_RE.test(text) ? `${text}T00:00:00-05:00` : text;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return this.fail(name, "No es una fecha válida");
    }
    return parsed.toISOString();
  }

  uuid(name: string, opts: BaseOpts = {}): string | null | undefined {
    const g = this.guard(name, opts);
    if (g.skip) return g.value as null | undefined;

    const text = String(g.value).trim();
    if (!text && opts.nullable) return null;
    if (!UUID_RE.test(text)) {
      return this.fail(name, "No es un identificador válido");
    }
    return text;
  }

  array(name: string, opts: ArrayOpts = {}): unknown[] | undefined {
    const g = this.guard(name, opts);
    if (g.skip) return undefined;

    if (!Array.isArray(g.value)) {
      return this.fail(name, "Debe ser una lista");
    }
    if (opts.min !== undefined && g.value.length < opts.min) {
      return this.fail(
        name,
        opts.min === 1
          ? "No puede ir vacía"
          : `Necesita al menos ${opts.min} elementos`,
      );
    }
    if (opts.max !== undefined && g.value.length > opts.max) {
      return this.fail(name, `No puede pasar de ${opts.max} elementos`);
    }
    return g.value;
  }

  add(name: string, message: string): void {
    this.errors[name] = message;
  }

  get hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  check(): void {
    if (this.hasErrors) throw invalidPayload(this.errors);
  }
}

// Quita las claves en undefined para poder mandar el objeto a un update
// parcial sin pisar columnas que nadie tocó. Los null sí se conservan: null es
// "borrar el valor" y eso es una intención.
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out as Partial<T>;
}

export function requireUuidParam(
  value: string,
  label = "El identificador",
): string {
  if (!isUuid(value)) {
    throw badRequest(`${label} de la URL no es válido`);
  }
  return value;
}

export function requireNonEmpty(patch: Record<string, unknown>): void {
  if (Object.keys(patch).length === 0) {
    throw new ApiError(
      422,
      "No se envió ningún campo para actualizar",
      "empty_patch",
    );
  }
}
