// Genera las semillas SQL de Supabase a partir de los datos de la app.
//
//   npm run sql:generate
//
// Lee src/lib/data/*.data.ts (lo que hoy consume el mock) y escribe
// supabase/sql/10_seed_products.sql, 11_seed_daily_closes.sql y
// 12_seed_expenses.sql. Así la base de datos y el mock siempre dicen lo mismo:
// si cambia el Excel se corre `npm run import:excel` y después esto.
//
// Los archivos generados están marcados como "no editar a mano": cualquier
// cambio manual se pierde al volver a correr esto.
//
// Los id son UUID v5 derivados del identificador del mock (el sku del producto,
// la fecha del cierre, el id del gasto). Son estables entre corridas, así que
// volver a ejecutar la semilla no duplica filas: el `on conflict do nothing`
// las reconoce.
//
// LAS SEMILLAS VAN AL FINAL
// Por eso llevan los números 10, 11 y 12: las tres necesitan el esquema
// completo —la tabla `tiendas` la crea el 06 y la tabla `categories` la crea el
// 09— y además la tienda ya creada con `node scripts/seed-tiendas.mjs`. Cada
// archivo lo comprueba al empezar y se planta con un mensaje claro si le falta
// algo, en vez de insertar cero filas en silencio.
//
// Nada de tienda_id ni de category_id va escrito a mano: se resuelven contra la
// base por el NOMBRE de la tienda y de la categoría. Así el archivo sirve en
// cualquier proyecto de Supabase, no solo en el que se generó.

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

// A qué tienda entran los datos del Excel. Es la misma que crea
// scripts/seed-tiendas.mjs y a la que ese script le asignaba las filas viejas:
// todo el histórico de 2025 es de este negocio. The Sunny Go arranca vacía.
const TIENDA = "Jose's Market";

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

// Un INSERT por bloque de filas: el editor SQL de Supabase se atora con
// sentencias gigantes de miles de VALUES.
const CHUNK = 100;

/**
 * Un insert que saca tienda_id de la propia base, buscándola por nombre.
 *
 * Sale un `insert ... select` en vez de un `insert ... values` porque el
 * tienda_id no se puede escribir en el archivo: es un uuid que cambia en cada
 * proyecto de Supabase. El cross join contra `tiendas` filtrado por nombre lo
 * resuelve al momento de correr.
 *
 * Los ::tipo del select no sobran: dentro de un VALUES suelto, una columna que
 * en todas sus filas es null se queda sin tipo y Postgres la toma como texto.
 *
 * `on conflict do nothing` sin decir cuál: así atrapa tanto el id repetido como
 * el sku repetido dentro de la tienda, y volver a correr la semilla nunca falla.
 *
 * joins  -> líneas extra de join (las usa el catálogo para la categoría)
 * select -> qué va en cada columna, ya sea de la fila (v.x) o de un join (c.id)
 */
function buildTiendaInserts({
  table,
  columns,
  valueColumns,
  select,
  rows,
  joins = "",
}) {
  const out = [];
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    out.push(
      [
        `insert into public.${table} (${columns.join(", ")})`,
        `select`,
        select.map((expr) => `  ${expr}`).join(",\n"),
        `from public.tiendas t`,
        `cross join (values`,
        slice.map((r) => `  (${r.join(", ")})`).join(",\n"),
        `) as v (${valueColumns.join(", ")})`,
        ...(joins ? [joins] : []),
        `where lower(btrim(t.nombre)) = lower(btrim(${Stext(TIENDA)}))`,
        `on conflict do nothing;`,
      ].join("\n"),
    );
  }
  return out.join("\n\n");
}

/**
 * Lo primero de cada semilla: comprobar que la base esté lista.
 *
 * Sin esto, correr el archivo sobre un esquema a medias no da error: el cross
 * join contra una tienda que no existe devuelve cero filas y el editor dice
 * "Success. No rows returned", que se lee como si hubiera funcionado.
 */
function schemaGuard({ needsCategories = false } = {}) {
  const checks = [
    [
      "public.tiendas",
      "Falta el esquema multi-tienda. Correr supabase/sql/06_tiendas.sql y las que siguen.",
    ],
    ...(needsCategories
      ? [
          [
            "public.categories",
            "Faltan las categorías. Correr supabase/sql/09_categorias_y_marcas.sql.",
          ],
        ]
      : []),
  ];

  return [
    "do $guard$",
    "begin",
    ...checks.flatMap(([relation, message]) => [
      `  if to_regclass(${Stext(relation)}) is null then`,
      `    raise exception ${Stext(message)};`,
      "  end if;",
    ]),
    "  if not exists (",
    "    select 1 from public.tiendas",
    `    where lower(btrim(nombre)) = lower(btrim(${Stext(TIENDA)}))`,
    "  ) then",
    `    raise exception 'No existe la tienda % en esta base. Correr antes: node scripts/seed-tiendas.mjs', ${Stext(TIENDA)};`,
    "  end if;",
    "end",
    "$guard$;",
  ].join("\n");
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
  // null::text y no null a secas: la foto está vacía en los 435, y una columna
  // que en todas sus filas es null se queda sin tipo dentro del VALUES.
  p.photo ? Stext(p.photo) : "null::text",
  N(p.price),
  N(p.cost_price),
  N(p.stock ?? 0),
  Stext(p.category),
  Stext(p.description ?? ""),
  S(p.created_at),
]);

// Las categorías que trae el Excel, una sola vez cada una. Tienen que existir
// antes que los productos que las nombran.
const categoryNames = [
  ...new Set(
    products
      .map((p) => String(p.category ?? "").trim())
      .filter((name) => name && name.toLowerCase() !== "sin categoría"),
  ),
].sort((a, b) => a.localeCompare(b, "es"));

const categoriesInsert = [
  "insert into public.categories (tienda_id, name)",
  "select t.id, c.name::text",
  "from public.tiendas t",
  "cross join (values",
  categoryNames.map((name) => `  (${Stext(name)})`).join(",\n"),
  ") as c (name)",
  `where lower(btrim(t.nombre)) = lower(btrim(${Stext(TIENDA)}))`,
  "on conflict do nothing;",
].join("\n");

fs.writeFileSync(
  path.join(OUT, "10_seed_products.sql"),
  header("Boxes · Catálogo de productos", [
    "Va después del 09 y de `node scripts/seed-tiendas.mjs`: necesita el esquema",
    "completo y la tienda ya creada. El archivo lo comprueba y avisa si falta algo.",
    "",
    `${products.length} productos importados del Excel de 2025 (Hoja2), a la tienda "${TIENDA}".`,
    "El costo real de factura se guardó cuando lo traía el Excel; el resto es",
    "precio x 0.81 (el margen del 19% de la contabilidad), un número circular",
    "que no se muestra como dato firme en la UI.",
    "",
    `Primero se crean las ${categoryNames.length} categorías y después los productos, que la`,
    "buscan por nombre. La MARCA queda vacía en los 435: el Excel no la traía y",
    "no se inventa. Se va llenando a mano o al escanear el código de barras.",
    "",
    "stock queda en 0 en todos: el Excel nunca llevó inventario. Hay que contar.",
    "barcode queda vacío por la misma razón.",
    "",
    "Volver a correr este archivo no duplica ni pisa nada (on conflict do nothing).",
    "Para reimportar el catálogo desde cero: delete from public.products; y correr de nuevo",
    "(ojo: eso borra el stock contado y deja las ventas viejas sin producto asociado).",
  ]) +
    "\n" +
    schemaGuard({ needsCategories: true }) +
    "\n\n" +
    categoriesInsert +
    "\n\n" +
    buildTiendaInserts({
      table: "products",
      columns: [
        "id",
        "tienda_id",
        "name",
        "sku",
        "barcode",
        "photo",
        "price",
        "cost_price",
        "stock",
        "category_id",
        "description",
        "created_at",
      ],
      valueColumns: [
        "id",
        "name",
        "sku",
        "barcode",
        "photo",
        "price",
        "cost_price",
        "stock",
        "category",
        "description",
        "created_at",
      ],
      select: [
        "v.id::uuid",
        "t.id",
        "v.name::text",
        "v.sku::text",
        "v.barcode::text",
        "v.photo::text",
        "v.price::numeric",
        "v.cost_price::numeric",
        "v.stock::numeric",
        "c.id",
        "v.description::text",
        "v.created_at::timestamptz",
      ],
      // left join y no join: si alguna categoría faltara, el producto entra sin
      // ella en vez de desaparecer de la semilla sin que nadie se entere.
      joins: [
        "left join public.categories c",
        "  on c.tienda_id = t.id",
        " and lower(btrim(c.name)) = lower(btrim(v.category))",
      ].join("\n"),
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
  path.join(OUT, "11_seed_daily_closes.sql"),
  header("Boxes · Cierres diarios de 2025", [
    "Necesita la tabla `tiendas` (06_tiendas.sql) y la tienda ya creada con",
    "`node scripts/seed-tiendas.mjs`.",
    "",
    `${dailyCloses.length} días, uno por cada fila de Hoja1 del Excel, a la tienda "${TIENDA}".`,
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
    schemaGuard() +
    "\n\n" +
    buildTiendaInserts({
      table: "daily_closes",
      columns: [
        "id",
        "tienda_id",
        "date",
        "sales_total",
        "gain",
        "expenses_total",
        "purchases_total",
        "cash_in",
        "cash_out",
        "source",
      ],
      valueColumns: [
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
      select: [
        "v.id::uuid",
        "t.id",
        "v.date::date",
        "v.sales_total::numeric",
        "v.gain::numeric",
        "v.expenses_total::numeric",
        "v.purchases_total::numeric",
        "v.cash_in::numeric",
        "v.cash_out::numeric",
        "v.source::public.daily_close_source",
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
  path.join(OUT, "12_seed_expenses.sql"),
  header("Boxes · Gastos y movimientos de caja de 2025", [
    "Necesita la tabla `tiendas` (06_tiendas.sql) y la tienda ya creada con",
    "`node scripts/seed-tiendas.mjs`.",
    "",
    `${expenses.length} registros a la tienda "${TIENDA}": ${byKind.gasto ?? 0} gastos, ${byKind.entrada ?? 0} entradas y ${byKind.salida ?? 0} salidas de caja.`,
    "",
    "El Excel nunca guardó el concepto de un gasto, solo el total del día en una",
    "celda. Por eso todos entran con un concepto genérico: son el punto de",
    "partida para que de aquí en adelante los gastos se detallen uno por uno.",
    "",
    "OJO con el doble conteo: las filas kind=gasto son el mismo dinero que",
    "daily_closes.expenses_total. Al sumar hay que usar una fuente o la otra.",
  ]) +
    "\n" +
    schemaGuard() +
    "\n\n" +
    buildTiendaInserts({
      table: "expenses",
      columns: ["id", "tienda_id", "date", "kind", "amount", "concept", "notes"],
      valueColumns: ["id", "date", "kind", "amount", "concept", "notes"],
      select: [
        "v.id::uuid",
        "t.id",
        "v.date::date",
        "v.kind::public.expense_kind",
        "v.amount::numeric",
        "v.concept::text",
        "v.notes::text",
      ],
      rows: expenseRows,
    }) +
    "\n",
  "utf8",
);

console.log(`10_seed_products.sql       ${products.length} productos`);
console.log(`11_seed_daily_closes.sql   ${dailyCloses.length} cierres diarios`);
console.log(
  `12_seed_expenses.sql       ${expenses.length} gastos y movimientos`,
);
console.log(`\nTodo entra a la tienda "${TIENDA}".`);
console.log(
  "Van después de las migraciones y de `node scripts/seed-tiendas.mjs`;",
);
console.log("el número de cada archivo ya dice en qué orden. Ver supabase/README.md.");
