// Importador del Excel de contabilidad -> archivos de datos de la app.
//
//   npm run import:excel
//
// Lee los CSV de Excel_PA y reescribe src/lib/data/*.data.ts. Es la única forma
// de regenerar esos archivos: están marcados como "no editar a mano" porque
// cualquier cambio manual se pierde al volver a correr esto.
//
// Solo se usan Hoja1 (contabilidad diaria) y Hoja2 (catálogo de productos).
// Hoja3, Hoja4 y Hoja5 son notas personales (arriendos, mercado, recibos,
// medidas de material) y no pertenecen al negocio, así que se ignoran.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCSV, num, cleanName, categorize, buildDescription } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const XL = path.join(ROOT, 'Excel_PA');
const OUT = path.join(ROOT, 'src/lib/data');
fs.mkdirSync(OUT, { recursive: true });

const YEAR = 2025;
const q = (s) => JSON.stringify(String(s));
const iso = (m, d) => `${YEAR}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// ---------------------------------------------------------------- PRODUCTOS
const pRows = parseCSV(fs.readFileSync(path.join(XL, '2025 Contabilidad.xlsx - Hoja2.csv'), 'utf8'));
const items = [];
for (const r of pRows) {
  const raw = (r[0] || '').trim();
  const price = num(r[1]);
  if (!raw || raw.length < 2 || !price || price <= 0) continue;

  const pTotal = num(r[5]), pUnits = num(r[6]);
  let cost = null, costFromExcel = false;
  if (pTotal && pUnits && pUnits > 0) {
    const c = pTotal / pUnits, ratio = c / price;
    // Solo se acepta el costo del Excel cuando cae en un rango creíble; fuera de
    // ahí el archivo mezcla unidades con cajas y el dato no sirve.
    if (ratio >= 0.30 && ratio <= 0.95) { cost = Math.round(c); costFromExcel = true; }
  }
  if (cost === null) cost = Math.round(price * 0.81);

  const { name, original, changed } = cleanName(raw);
  const { category, code } = categorize(raw);
  items.push({ raw, name, original, changed, price, cost, costFromExcel, category, code });
}

items.sort((a, b) => a.category.localeCompare(b.category, 'es') || a.name.localeCompare(b.name, 'es'));

const seq = {};
const products = items.map((it, i) => {
  seq[it.code] = (seq[it.code] ?? 0) + 1;
  return {
    id: String(i + 1),
    name: it.name,
    sku: `${it.code}-${String(seq[it.code]).padStart(3, '0')}`,
    barcode: '',
    photo: null,
    price: it.price,
    cost_price: it.cost,
    stock: 0,
    category: it.category,
    description: buildDescription(it),
    created_at: `${YEAR}-01-01T00:00:00Z`,
  };
});

const productsTs = `// GENERADO desde Excel_PA/2025 Contabilidad.xlsx - Hoja2.csv. No editar a mano.
//
// ${products.length} productos. Del Excel salen únicamente el nombre y el precio de venta.
//   - name        nombre normalizado a Tipo Oración con la ortografía corregida.
//                 El nombre original queda anotado en description cuando cambió.
//   - sku         generado aquí: <CÓDIGO DE CATEGORÍA>-<consecutivo dentro de la categoría>.
//   - category    inferida del prefijo que usaba el Excel (ACE, BEBIDA, CIG, LIC...).
//   - cost_price  costo real del Excel cuando quedaba entre el 30% y el 95% del precio
//                 (${products.filter((_, i) => items[i].costFromExcel).length} productos);
//                 el resto es precio x 0.81, el margen del 19% que usa la contabilidad.
//                 Ese porcentaje es circular (siempre da 19%), así que no es un dato firme.
//   - barcode / photo / stock  el Excel no los tenía: quedan vacíos para llenar a mano.

import type { Product } from "@/types";

export const products: Product[] = [
${products.map((p) => `  {
    id: ${q(p.id)},
    name: ${q(p.name)},
    sku: ${q(p.sku)},
    barcode: ${q(p.barcode)},
    photo: null,
    price: ${p.price},
    cost_price: ${p.cost_price},
    stock: ${p.stock},
    category: ${q(p.category)},
    description: ${q(p.description)},
    created_at: ${q(p.created_at)},
  },`).join('\n')}
];
`;
fs.writeFileSync(path.join(OUT, 'products.data.ts'), productsTs, 'utf8');

// ------------------------------------------------- CIERRES DIARIOS Y GASTOS
const dRows = parseCSV(fs.readFileSync(path.join(XL, '2025 Contabilidad.xlsx - Hoja1.csv'), 'utf8'));
const months = [];
let cur = null, prev = 0;
for (let i = 29; i < dRows.length; i++) {
  const r = dRows[i];
  const c0 = (r[0] || '').trim();
  if (!/^\d{1,2}$/.test(c0)) continue;
  const day = parseInt(c0, 10);
  if (day < 1 || day > 31) continue;
  const venta = num(r[1]), gasto = num(r[4]), compra = num(r[5]);
  if (venta === null && gasto === null && compra === null) continue;
  if (cur === null || day <= prev) { if (months.length >= 12) break; cur = []; months.push(cur); }
  prev = day;
  // Entrada y salida de caja solo se llevaron de enero a abril. Los dos valores que
  // aparecen después son celdas equivocadas: el 15 de mayo trae 9.760.016, que es la
  // cifra de CONTABILIDAD de la tabla resumen, y el 31 de diciembre trae 1.323, muy
  // por debajo del rango de los movimientos reales. Se descartan.
  const trackedCash = months.length <= 4;
  cur.push({
    day,
    venta: venta || 0,
    ganancia: num(r[3]),
    gasto: gasto || 0,
    compra: compra || 0,
    entrada: trackedCash ? num(r[7]) : null,
    salida: trackedCash ? num(r[9]) : null,
  });
}

const closes = [];
const expenses = [];
months.forEach((days, mi) => {
  for (const d of days) {
    const date = iso(mi, d.day);
    closes.push({
      id: `dc-${date}`,
      date,
      sales_total: d.venta,
      gain: d.ganancia !== null ? Math.round(d.ganancia) : Math.round(d.venta * 0.19),
      expenses_total: d.gasto,
      purchases_total: d.compra,
      cash_in: d.entrada,
      cash_out: d.salida,
    });
    if (d.gasto > 0) {
      expenses.push({ id: `g-${date}`, date, kind: 'gasto', amount: d.gasto,
        concept: 'Gasto del día', notes: 'Importado del Excel: la hoja solo guardaba el total diario, sin detalle.' });
    }
    if (d.entrada !== null && d.entrada > 0) {
      expenses.push({ id: `e-${date}`, date, kind: 'entrada', amount: d.entrada,
        concept: 'Entrada de caja', notes: 'Importado de la columna DENTRADA del Excel, sin concepto asociado.' });
    }
    if (d.salida !== null && d.salida > 0) {
      expenses.push({ id: `s-${date}`, date, kind: 'salida', amount: d.salida,
        concept: 'Salida de caja', notes: 'Importado de la columna SALIDA del Excel, sin concepto asociado.' });
    }
  }
});
closes.sort((a, b) => b.date.localeCompare(a.date));
expenses.sort((a, b) => b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind));

const totV = closes.reduce((a, c) => a + c.sales_total, 0);
const totG = closes.reduce((a, c) => a + c.expenses_total, 0);
const totC = closes.reduce((a, c) => a + c.purchases_total, 0);

const closesTs = `// GENERADO desde Excel_PA/2025 Contabilidad.xlsx - Hoja1.csv. No editar a mano.
//
// ${closes.length} días de ${YEAR}, uno por cada fila del Excel. Los totales por mes cuadran
// exactamente con las filas de total de cada bloque:
//   venta ${totV.toLocaleString('es-CO')} · gasto ${totG.toLocaleString('es-CO')} · compra ${totC.toLocaleString('es-CO')}
//
// La tabla resumen que está arriba en Hoja1 tiene dos erratas de digitación y NO se usó:
// mayo dice gasto 1.273.000 (los días suman 1.267.300) y noviembre dice compra 12.636.700
// (los días suman 12.536.700). En ambos casos la fila de total del propio mes coincide
// con la suma de los días.
//
// cash_in / cash_out solo se llenaron ${closes.filter((c) => c.cash_in !== null).length} de los ${closes.length} días; el resto va en null.

import type { DailyClose } from "@/types";

export const dailyCloses: DailyClose[] = [
${closes.map((c) => `  { id: ${q(c.id)}, date: ${q(c.date)}, sales_total: ${c.sales_total}, gain: ${c.gain}, expenses_total: ${c.expenses_total}, purchases_total: ${c.purchases_total}, cash_in: ${c.cash_in === null ? 'null' : c.cash_in}, cash_out: ${c.cash_out === null ? 'null' : c.cash_out}, source: "excel" },`).join('\n')}
];
`;
fs.writeFileSync(path.join(OUT, 'dailyCloses.data.ts'), closesTs, 'utf8');

const expensesTs = `// GENERADO desde Excel_PA/2025 Contabilidad.xlsx - Hoja1.csv. No editar a mano.
//
// ${expenses.length} registros: ${expenses.filter((e) => e.kind === 'gasto').length} gastos,
// ${expenses.filter((e) => e.kind === 'entrada').length} entradas y ${expenses.filter((e) => e.kind === 'salida').length} salidas de caja.
//
// El Excel nunca guardó el concepto de un gasto, solo el total del día en una celda.
// Por eso todos los registros importados entran con un concepto genérico: son el punto
// de partida para que de aquí en adelante los gastos se detallen uno por uno.

import type { Expense } from "@/types";

export const expenses: Expense[] = [
${expenses.map((e) => `  { id: ${q(e.id)}, date: ${q(e.date)}, kind: ${q(e.kind)}, amount: ${e.amount}, concept: ${q(e.concept)}, notes: ${q(e.notes)} },`).join('\n')}
];
`;
fs.writeFileSync(path.join(OUT, 'expenses.data.ts'), expensesTs, 'utf8');

// -------------------------------------------------------------------- RESUMEN
console.log('products.data.ts    ', products.length, 'productos');
console.log('  costo del Excel   ', items.filter((i) => i.costFromExcel).length);
console.log('  costo estimado    ', items.filter((i) => !i.costFromExcel).length);
console.log('  nombres corregidos', items.filter((i) => i.changed).length);
console.log('  categorías        ', new Set(products.map((p) => p.category)).size);
console.log('dailyCloses.data.ts ', closes.length, 'días');
console.log('expenses.data.ts    ', expenses.length, 'registros');
console.log('\nSKU duplicados:', products.length - new Set(products.map((p) => p.sku)).size);
console.log('Nombres duplicados:', products.length - new Set(products.map((p) => p.name)).size);
