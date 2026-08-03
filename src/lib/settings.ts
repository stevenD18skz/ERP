// Configuración de la tienda: la forma del jsonb que vive en tiendas.settings
// (ver supabase/sql/01_schema.sql) y las reglas para leerlo sin que
// un valor viejo o a medio llenar rompa nada.
//
// Isomórfico a propósito: lo importan tanto la ruta /api/settings (servidor)
// como los hooks y la página de Configuración (navegador), así que no puede
// traer nada de Supabase ni de next/server.

export interface BoxesSettings {
  /**
   * Si el celular emparejado como lector se desconecta solo (apaga la cámara,
   * cierra el modal) después de un rato sin escanear nada. Apagado = se queda
   * conectado sin límite, a costa de la batería del teléfono.
   */
  phoneScannerAutoDisconnect: boolean;
  /** Cuánto rato sin leer nada antes de desconectar, en segundos. */
  phoneScannerIdleSeconds: number;
}

export const PHONE_SCANNER_IDLE_STEP_SECONDS = 30;
export const PHONE_SCANNER_IDLE_MIN_SECONDS = 30;
export const PHONE_SCANNER_IDLE_MAX_SECONDS = 300;
export const DEFAULT_PHONE_SCANNER_IDLE_SECONDS = 60;

export const DEFAULT_SETTINGS: BoxesSettings = {
  phoneScannerAutoDisconnect: true,
  phoneScannerIdleSeconds: DEFAULT_PHONE_SCANNER_IDLE_SECONDS,
};

/** Ajusta al escalón de 30s más cercano y lo deja dentro del rango permitido. */
export function clampPhoneScannerIdleSeconds(value: number): number {
  const stepped =
    Math.round(value / PHONE_SCANNER_IDLE_STEP_SECONDS) *
    PHONE_SCANNER_IDLE_STEP_SECONDS;
  return Math.min(
    PHONE_SCANNER_IDLE_MAX_SECONDS,
    Math.max(PHONE_SCANNER_IDLE_MIN_SECONDS, stepped),
  );
}

/**
 * Del jsonb crudo (o de un parche a medio llenar) a la forma completa, con
 * los valores por defecto donde falte algo. Nunca lanza: un settings roto o
 * viejo simplemente vuelve al default en los campos que no entienda.
 */
export function mergeSettings(raw: unknown): BoxesSettings {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const autoDisconnect =
    typeof source.phoneScannerAutoDisconnect === "boolean"
      ? source.phoneScannerAutoDisconnect
      : DEFAULT_SETTINGS.phoneScannerAutoDisconnect;

  const idleSecondsRaw = Number(source.phoneScannerIdleSeconds);
  const idleSeconds = Number.isFinite(idleSecondsRaw)
    ? clampPhoneScannerIdleSeconds(idleSecondsRaw)
    : DEFAULT_SETTINGS.phoneScannerIdleSeconds;

  return {
    phoneScannerAutoDisconnect: autoDisconnect,
    phoneScannerIdleSeconds: idleSeconds,
  };
}

/** "90" -> "1 min 30 s", para mostrar en la barra y en la pantalla del celular. */
export function formatIdleDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes === 0) return `${rest} s`;
  if (rest === 0) return `${minutes} min`;
  return `${minutes} min ${rest} s`;
}
