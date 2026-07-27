// El dashboard de Supabase muestra varias URL del mismo proyecto y es fácil
// copiar la equivocada. supabase-js espera la raíz
// (https://xxxx.supabase.co) y le agrega /rest/v1, /auth/v1, etc. según el
// caso; si le pasan la URL de la API REST termina pidiendo
// .../rest/v1/rest/v1/... y todo responde 404.
//
// Esto acepta cualquiera de las dos y devuelve siempre la raíz.
export function normalizeSupabaseUrl(url: string): string {
  return String(url ?? "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(rest|auth|storage|realtime|functions)\/v\d+$/i, "");
}
