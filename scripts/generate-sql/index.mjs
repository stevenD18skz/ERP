// Genera las semillas SQL de Supabase a partir de los datos de la app.
//
//   npm run sql:generate
//
// Lee src/lib/data/*.data.ts (lo que hoy consume el mock) y escribe
// supabase/sql/02_seed_products.sql, 03_seed_daily_closes.sql y
// 04_seed_expenses.sql. Así la base de datos y el mock siempre dicen lo mismo:
// si cambia el Excel se corre `npm run import:excel` y después esto.
//
// Los archivos generados están marcados como "no editar a mano": cualquier
// cambio manual se pierde al volver a correr esto.
//
// Los id son UUID v5 derivados del identificador del mock (el sku del producto,
// la fecha del cierre, el id del gasto). Son estables entre corridas, así que
// volver a ejecutar la semilla no duplica filas: el `on conflict (id) do
// nothing` las reconoce.

import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const DATA = path.join(ROOT, "src/lib/data");
const OUT = path.join(ROOT, "supabase/sql");
fs.mkdirSync(OUT, { recursive: true });

// Namespace fijo de este proyecto. Cambiarlo regenera TODOS los id.
const NAMESPACE = "1b4e28ba-2fa1-11d2-883f-0016d3cca427";

function uuid5(name) {
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ""), "hex");
  const hash = createHash("sha1")
    .update(Buffer.concat([ns, Buffer.from(name, "utf8")]))
    .digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50; // versión 5
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// Los .data.ts son literales de array de JavaScript válidos (los genera el
// importador con JSON.stringify), así que basta con recortar el TypeScript de
// alrededor y evaluar el arreglo.
function readDataFile(file, exportName) {
  const src = fs.readFileSync(path.join(DATA, file), "utf8");
  const marker = `export const ${exportName}`;
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(`No se encontró "${marker}" en ${file}`);
  const open = src.indexOf("[", start);
  const close = src.lastIndexOf("];");
  if (open === -1 || close === -1)
    throw new Error(`No se pudo leer el arreglo de ${file}`);
  const literal = src.slice(open, close + 1);
  return new Function(`return ${literal}`)();
}

// --- Serialización SQL -----------------------------------------------------
const S = (v) => {
  if (v === null || v === undefined || v === "")
    return v === "" ? "''" : "null";
  return `'${String(v).replace(/'/g, "''")}'`;
};
const Stext = (v) => `'${String(v ?? "").replace(/'/g, "''")}'`;
const N = (v) =>
  v === null || v === undefined || v === "" || Number.isNaN(Number(v))
    ? "null"
    : String(Number(v));
const B = (v) => (v ? "true" : "false");

// Un INSERT por bloque de filas: el editor SQL de Supabase se atora con
// sentencias gigantes de miles de VALUES.
const CHUNK = 100;

function buildInserts({ table, columns, rows, conflict = "id" }) {
  const out = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    out.push(
      `insert into public.${table} (${columns.join(", ")}) values\n` +
        slice.map((r) => `  (${r.join(", ")})`).join(",\n") +
        `\non conflict (${conflict}) do nothing;`,
    );
  }
  return out.join("\n\n");
}

function header(title, lines) {
  return [
    "-- " + "=".repeat(75),
    `-- ${title}`,
    "-- " + "=".repeat(75),
    "-- GENERADO por scripts/generate-sql. No editar a mano: se regenera con",
    "-- `npm run sql:generate` y cualquier cambio manual se pierde.",
    "--",
    ...lines.map((l) => `-- ${l}`),
    "-- " + "=".repeat(75),
    "",
  ].join("\n");
}

// ------------------------------------------------------------- PRODUCTOS ---
const products = readDataFile("products.data.ts", "products");
const skus = new Set(products.map((p) => p.sku));
if (skus.size !== products.length)
  throw new Error("Hay sku repetidos: el sku es la clave única en la base");

const productRows = products.map((p) => [
  S(uuid5(`product:${p.sku}`)),
  Stext(p.name),
  Stext(p.sku),
  Stext(p.barcode ?? ""),
  p.photo ? Stext(p.photo) : "null",
  N(p.price),
  N(p.cost_price),
  B(p.cost_is_estimated),
  N(p.stock ?? 0),
  Stext(p.category),
  Stext(p.description ?? ""),
  S(p.created_at),
]);

const estimated = products.filter((p) => p.cost_is_estimated).length;
fs.writeFileSync(
  path.join(OUT, "02_seed_products.sql"),
  header("ERP Supermercado · Catálogo de productos", [
    `${products.length} productos importados del Excel de 2025 (Hoja2).`,
    `${products.length - estimated} tienen costo real de factura; ${estimated} lo tienen estimado`,
    "en precio x 0.81 (el margen del 19% de la contabilidad) y están marcados",
    "con cost_is_estimated = true.",
    "",
    "stock queda en 0 en todos: el Excel nunca llevó inventario. Hay que contar.",
    "barcode queda vacío por la misma razón.",
    "",
    "Volver a correr este archivo no duplica ni pisa nada (on conflict do nothing).",
    "Para reimportar el catálogo desde cero: delete from public.products; y correr de nuevo",
    "(ojo: eso borra el stock contado y deja las ventas viejas sin producto asociado).",
  ]) +
    "\n" +
    buildInserts({
      table: "products",
      columns: [
        "id",
        "name",
        "sku",
        "barcode",
        "photo",
        "price",
        "cost_price",
        "cost_is_estimated",
        "stock",
        "category",
        "description",
        "created_at",
      ],
      rows: productRows,
    }) +
    "\n",
  "utf8",
);

// ---------------------------------------------------------- CIERRE DIARIO --
const dailyCloses = readDataFile("dailyCloses.data.ts", "dailyCloses");
const closeRows = dailyCloses.map((c) => [
  S(uuid5(`daily_close:${c.date}`)),
  S(c.date),
  N(c.sales_total),
  N(c.gain),
  N(c.expenses_total),
  N(c.purchases_total),
  N(c.cash_in),
  N(c.cash_out),
  S(c.source ?? "excel"),
]);

const sum = (k) => dailyCloses.reduce((a, c) => a + (Number(c[k]) || 0), 0);
const fmt = (n) => n.toLocaleString("es-CO");
fs.writeFileSync(
  path.join(OUT, "03_seed_daily_closes.sql"),
  header("ERP Supermercado · Cierres diarios de 2025", [
    `${dailyCloses.length} días, uno por cada fila de Hoja1 del Excel.`,
    `Totales del año: venta ${fmt(sum("sales_total"))} · ganancia ${fmt(sum("gain"))} ·`,
    `gasto ${fmt(sum("expenses_total"))} · compra ${fmt(sum("purchases_total"))}.`,
    "",
    "Cuadran con las filas de total de cada mes del Excel. La tabla resumen que",
    "está arriba en Hoja1 tiene dos erratas de digitación y no se usó.",
    "",
    "cash_in / cash_out solo se llenaron en algunos días; el resto va en null",
    'para no confundir "no se anotó" con "fue cero".',
  ]) +
    "\n" +
    buildInserts({
      table: "daily_closes",
      columns: [
        "id",
        "date",
        "sales_total",
        "gain",
        "expenses_total",
        "purchases_total",
        "cash_in",
        "cash_out",
        "source",
      ],
      rows: closeRows,
    }) +
    "\n",
  "utf8",
);

// ---------------------------------------------------------------- GASTOS ---
const expenses = readDataFile("expenses.data.ts", "expenses");
const expenseRows = expenses.map((e) => [
  S(uuid5(`expense:${e.id}`)),
  S(e.date),
  S(e.kind),
  N(e.amount),
  Stext(e.concept ?? ""),
  Stext(e.notes ?? ""),
]);

const byKind = expenses.reduce(
  (acc, e) => ({ ...acc, [e.kind]: (acc[e.kind] ?? 0) + 1 }),
  {},
);
fs.writeFileSync(
  path.join(OUT, "04_seed_expenses.sql"),
  header("ERP Supermercado · Gastos y movimientos de caja de 2025", [
    `${expenses.length} registros: ${byKind.gasto ?? 0} gastos, ${byKind.entrada ?? 0} entradas y ${byKind.salida ?? 0} salidas de caja.`,
    "",
    "El Excel nunca guardó el concepto de un gasto, solo el total del día en una",
    "celda. Por eso todos entran con un concepto genérico: son el punto de",
    "partida para que de aquí en adelante los gastos se detallen uno por uno.",
    "",
    "OJO con el doble conteo: las filas kind=gasto son el mismo dinero que",
    "daily_closes.expenses_total. Al sumar hay que usar una fuente o la otra.",
  ]) +
    "\n" +
    buildInserts({
      table: "expenses",
      columns: ["id", "date", "kind", "amount", "concept", "notes"],
      rows: expenseRows,
    }) +
    "\n",
  "utf8",
);

console.log(`02_seed_products.sql       ${products.length} productos`);
console.log(`03_seed_daily_closes.sql   ${dailyCloses.length} cierres diarios`);
console.log(
  `04_seed_expenses.sql       ${expenses.length} gastos y movimientos`,
);
console.log("\nListo. Correr los archivos de supabase/sql en orden numérico.");
