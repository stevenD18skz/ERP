// Fecha local en AAAA-MM-DD. No usar Date.toISOString(): convierte a UTC y en
// Colombia (UTC-5) devuelve el día siguiente durante la tarde y la noche,
// haciendo que un cierre o gasto "de hoy" quede guardado con la fecha de mañana.
export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
