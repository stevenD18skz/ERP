// Fechas, rangos y agregaciones de Reportes.
//
// Las fechas se manejan como texto "AAAA-MM-DD" y se convierten a Date local
// solo para hacer cuentas. Usar Date.parse sobre ese texto lo interpretaría
// como UTC y en Colombia (UTC-5) correría todo un día hacia atrás.

export const MONTH_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];
export const MONTH_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
export const DAY_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
export const DAY_LONG = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];

export const RANGE_PRESETS = [
  { key: "hoy", label: "Hoy", days: 1 },
  { key: "7", label: "Últimos 7 días", days: 7 },
  { key: "30", label: "Últimos 30 días", days: 30 },
  { key: "mes", label: "Este mes", days: null },
  { key: "custom", label: "Elegir fechas", days: null },
];

export const parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const addDays = (d, n) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const dayDiff = (a, b) => Math.round((a - b) / 86400000);

export const fmtD = (d) => `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;

// Cifra corta para las etiquetas de las barras, donde no cabe el formato largo.
export const formatShort = (n) => {
  const v = Math.abs(n);
  if (v >= 1000000) return `$${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n)}`;
};

export const aggregate = (rows) =>
  rows.reduce(
    (a, c) => ({
      ventas: a.ventas + c.sales_total,
      ganancia: a.ganancia + c.gain,
      gasto: a.gasto + c.expenses_total,
      compra: a.compra + c.purchases_total,
    }),
    { ventas: 0, ganancia: 0, gasto: 0, compra: 0 },
  );

// Comparación contra el período anterior, en palabras: sin base con qué
// comparar no se inventa un porcentaje, se dice "Nuevo".
export const delta = (a, b) => {
  if (b === 0)
    return a === 0
      ? { label: "Sin cambio", dir: "flat" }
      : { label: "Nuevo", dir: "up" };
  const pct = Math.round(((a - b) / b) * 100);
  if (pct === 0) return { label: "Igual que antes", dir: "flat" };
  return {
    label: `${pct > 0 ? "+" : ""}${pct}% vs. período anterior`,
    dir: pct > 0 ? "up" : "down",
  };
};

// Barras por día; cuando el rango pasa de un mes se agrupan por semana, porque
// 90 barras de un píxel no se leen.
export const buildBuckets = (inRange) => {
  if (inRange.length === 0) return [];
  if (inRange.length > 31) {
    const out = [];
    for (let i = 0; i < inRange.length; i += 7) {
      const chunk = inRange.slice(i, i + 7);
      const first = parseISO(chunk[0].date);
      const last = parseISO(chunk[chunk.length - 1].date);
      out.push({
        key: `w${i}`,
        label: `${first.getDate()}-${last.getDate()} ${MONTH_SHORT[last.getMonth()]}`,
        longLabel: `Semana del ${first.getDate()} al ${last.getDate()} de ${MONTH_LONG[last.getMonth()]}`,
        ...aggregate(chunk),
      });
    }
    return out;
  }
  return inRange.map((c) => {
    const d = parseISO(c.date);
    return {
      key: c.date,
      label: inRange.length > 14 ? String(d.getDate()) : DAY_SHORT[d.getDay()],
      longLabel: `${DAY_LONG[d.getDay()]} ${d.getDate()} de ${MONTH_LONG[d.getMonth()]}`,
      ventas: c.sales_total,
      ganancia: c.gain,
      gasto: c.expenses_total,
      compra: c.purchases_total,
    };
  });
};

export const buildReportCSV = (rows) => {
  const head = "fecha,venta,ganancia,gasto,compra,entrada_caja,salida_caja";
  const body = rows.map((c) =>
    [
      c.date,
      c.sales_total,
      c.gain,
      c.expenses_total,
      c.purchases_total,
      c.cash_in ?? "",
      c.cash_out ?? "",
    ].join(","),
  );
  return [head, ...body];
};
