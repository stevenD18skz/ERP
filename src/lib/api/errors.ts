// Errores de la API con su código HTTP.
//
// Todo lo que sale mal termina siendo un ApiError: los que se lanzan a mano al
// validar y los que devuelve PostgREST, traducidos aquí a un mensaje que se
// pueda mostrar tal cual en pantalla.

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    status: number,
    message: string,
    code = "error",
    details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new ApiError(400, message, "bad_request", details);

export const notFound = (message = "No se encontró el recurso") =>
  new ApiError(404, message, "not_found");

export const conflict = (message: string, details?: unknown) =>
  new ApiError(409, message, "conflict", details);

export const unauthorized = (message = "No autenticado") =>
  new ApiError(401, message, "unauthenticated");

export const invalidPayload = (details: Record<string, string>) =>
  new ApiError(422, "Hay campos con errores", "invalid_payload", details);

// Restricciones de la base traducidas a algo que entienda quien usa la app.
const CONSTRAINT_MESSAGES: Record<string, string> = {
  daily_closes_tienda_date_key: "Ya existe un cierre para esa fecha",
  tiendas_nombre_lower_idx: "Ya existe una tienda con ese nombre",
  products_sku_key: "Ya hay un producto con ese SKU",
  sales_fiado_needs_client:
    "Una venta a crédito necesita el nombre del cliente",
  sale_items_quantity_check:
    "La cantidad de cada línea debe ser mayor que cero",
  order_items_quantity_check:
    "La cantidad de cada línea debe ser mayor que cero",
  products_price_check: "El precio no puede ser negativo",
  products_cost_price_check: "El costo no puede ser negativo",
  expenses_amount_check: "El monto no puede ser negativo",
};

function constraintMessage(raw: string, fallback: string): string {
  for (const [name, message] of Object.entries(CONSTRAINT_MESSAGES)) {
    if (raw.includes(name)) return message;
  }
  return fallback;
}

type PostgrestLikeError = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
};

const SCHEMA_HINT =
  "La base de datos no tiene el esquema del ERP. Correr supabase/sql/01_schema.sql en el SQL Editor de Supabase.";

// Traduce el error que devuelve PostgREST/Postgres al ApiError equivalente.
export function fromPostgrest(
  error: PostgrestLikeError,
  context = "la operación",
): ApiError {
  const code = error?.code ?? "";
  const raw = `${error?.message ?? ""} ${error?.details ?? ""}`;

  switch (code) {
    case "PGRST116": // .single() sin filas
      return notFound();

    case "23505": // unique_violation
      return conflict(
        constraintMessage(raw, "Ese registro ya existe"),
        error.details ?? undefined,
      );

    case "23503": // foreign_key_violation
      return conflict(
        "El registro está relacionado con otros datos, o apunta a algo que ya no existe",
        error.details ?? undefined,
      );

    case "23514": // check_violation
      return new ApiError(
        422,
        constraintMessage(raw, "Los datos no cumplen una regla de la base"),
        "check_violation",
      );

    case "23502": // not_null_violation
      return new ApiError(
        422,
        "Falta un campo obligatorio",
        "missing_field",
        error.details ?? undefined,
      );

    case "22P02": // invalid_text_representation
      return badRequest(
        "Un valor tiene un formato que la base no entiende (revisar id, fechas y números)",
      );

    case "22023": // los raise ... using errcode = '22023' de las funciones SQL
      return new ApiError(
        422,
        error.message ?? "Datos inválidos",
        "invalid_payload",
      );

    case "P0002": // los raise ... using errcode = 'P0002' de las funciones SQL
      return notFound(error.message ?? "No se encontró el recurso");

    case "42P01": // undefined_table
    case "42883": // undefined_function
      return new ApiError(503, SCHEMA_HINT, "schema_missing", error.message);

    case "42501": // insufficient_privilege
      return new ApiError(
        503,
        "Supabase rechazó la consulta por permisos (RLS). Configurar SUPABASE_SERVICE_ROLE_KEY en .env.local.",
        "rls_denied",
        error.message,
      );

    default:
      return new ApiError(
        500,
        error?.message || `No se pudo completar ${context}`,
        code || "database_error",
        error?.details ?? undefined,
      );
  }
}

// Cualquier cosa lanzada -> ApiError, para responder siempre con el mismo formato.
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof SyntaxError) {
    return badRequest("El cuerpo de la petición no es JSON válido");
  }

  const maybe = error as PostgrestLikeError;
  if (
    maybe &&
    typeof maybe === "object" &&
    "code" in maybe &&
    "message" in maybe
  ) {
    return fromPostgrest(maybe);
  }

  const message = error instanceof Error ? error.message : "Error inesperado";
  return new ApiError(500, message, "internal_error");
}
