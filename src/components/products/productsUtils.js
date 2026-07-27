// Constantes y cálculos compartidos por la página de Productos y sus
// componentes. Todo lo de aquí es puro: recibe un producto (o una fila de CSV)
// y devuelve un número, un texto o un error; nada toca la pantalla ni el
// servicio.

export const LOW_STOCK_THRESHOLD = 10;

export const CSV_TEMPLATE_HEADERS = [
  "name",
  "sku",
  "barcode",
  "category",
  "cost_price",
  "price",
  "stock",
  "description",
];

/* --- margen --- */

export const getMargin = (p) =>
  (Number(p.price) || 0) - (Number(p.cost_price) || 0);

// El margen se mide sobre el PRECIO DE VENTA, igual que la contabilidad del
// negocio: en Hoja1 la ganancia siempre fue venta x 19%. Medirlo sobre el costo
// daría otro número (23% en vez de 19%) y no cuadraría con el resto de la app.
export const getMarginPct = (p) =>
  Number(p.price) ? Math.round((getMargin(p) / Number(p.price)) * 100) : 0;

// Un costo estimado sale de multiplicar el precio por 0.81, así que su margen
// siempre devuelve 19%: es la suposición, no una medición. Se muestra en gris
// para que no se lea como un dato de factura.
export const isCostEstimated = (p) => Boolean(p.cost_is_estimated);

/* --- consulta por código de barras --- */

// Campos que puede llenar una consulta por código de barras. El precio, el
// costo y el stock quedan afuera a propósito: son datos del negocio y ningún
// catálogo de afuera los sabe.
export const LOOKUP_FIELDS = ["name", "category", "description"];

export const BARCODE_RE = /^\d{8,14}$/;

export const FIELD_LABELS = {
  name: "nombre",
  category: "categoría",
  description: "descripción",
  photo: "foto",
};

/* --- importación --- */

// Devuelve el motivo del rechazo, o null si la fila sirve.
//
// El SKU no se exige: es opcional en toda la aplicación (ver
// supabase/sql/08_products_sku_por_tienda.sql). Si viene, la base rechaza el
// repetido dentro de la misma tienda.
export const validateImportRow = (obj) => {
  if (!obj.name?.trim()) return "Falta el nombre";
  if (
    obj.price === undefined ||
    obj.price === "" ||
    Number.isNaN(Number(obj.price)) ||
    Number(obj.price) < 0
  )
    return "Precio inválido";
  if (
    obj.cost_price === undefined ||
    obj.cost_price === "" ||
    Number.isNaN(Number(obj.cost_price)) ||
    Number(obj.cost_price) < 0
  )
    return "Costo inválido";
  if (
    obj.stock === undefined ||
    obj.stock === "" ||
    Number.isNaN(Number(obj.stock)) ||
    Number(obj.stock) < 0
  )
    return "Stock inválido";
  return null;
};

export const CSV_TEMPLATE_ROWS = [
  CSV_TEMPLATE_HEADERS.join(","),
  [
    "Arroz 1Kg",
    "ARZ-001",
    "",
    "Granos",
    1800,
    2500,
    100,
    "Arroz blanco de grano largo",
  ].join(","),
];

/* --- exportación --- */

export const buildProductsCSV = (products) => {
  const rows = [
    "id,name,sku,barcode,category,cost_price,price,stock,description,created_at",
  ];
  products.forEach((p) =>
    rows.push(
      [
        p.id,
        JSON.stringify(p.name),
        p.sku,
        p.barcode || "",
        p.category,
        p.cost_price,
        p.price,
        p.stock,
        JSON.stringify(p.description || ""),
        p.created_at,
      ].join(","),
    ),
  );
  return rows;
};

export const buildProductsPrintHTML = (products) => {
  const cols = [
    "Nombre",
    "SKU",
    "Categoría",
    "Costo",
    "Precio",
    "Stock",
    "Descripción",
  ];
  return `
      <html><head><meta charset="utf-8"><title>Productos</title>
      <style>body{font-family:system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial;} table{width:100%;border-collapse:collapse;} th,td{padding:8px;border:1px solid #ddd;text-align:left;} th{background:#f7f7f7}</style>
      </head><body>
      <h2>Listado de productos — ${new Date().toLocaleString()}</h2>
      <table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
      <tbody>
      ${products.map((p) => `<tr><td>${p.name}</td><td>${p.sku}</td><td>${p.category}</td><td>${p.cost_price}</td><td>${p.price}</td><td>${p.stock}</td><td>${p.description || ""}</td></tr>`).join("")}
      </tbody></table>
      </body></html>`;
};
