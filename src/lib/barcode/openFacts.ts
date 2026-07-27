// Consulta de un código de barras contra las bases abiertas de Open Facts.
//
// Qué es: Open Food Facts —y sus hermanas de cosmética y de productos
// generales— es un catálogo colaborativo y gratuito donde la gente sube la
// ficha de los productos que compra. No pide clave ni cuenta.
//
// Qué NO es: no es un catálogo completo. En Colombia hay unos 7.000 alimentos
// registrados, así que las marcas grandes (Postobón, Refisal, Alpina, Nestlé)
// suelen aparecer, y lo local, lo artesanal o lo que se vende a granel casi
// nunca. Cuando no aparece no hay nada que inventar: el producto se llena a
// mano, y así se le dice a quien está escaneando.
//
// Qué se trae y qué no:
//   sí -> nombre, marca, presentación, categoría y foto. Son datos del
//         fabricante: valen igual en esta tienda que en cualquier otra.
//   no -> precio, costo y stock. Esos son del negocio, no salen de aquí y
//         tampoco se estiman. Los pone quien registra el producto.
//
// La licencia de los datos (ODbL) pide citar la fuente cuando se reusan: por
// eso cada resultado trae de dónde salió, y ese rastro termina escrito en la
// descripción del producto para poder revisarlo después.

const USER_AGENT = "Boxes-ERP/1.0 (ERP de tienda de barrio)";

// Cuánto se espera a cada base antes de darse por vencido. Quien escanea está
// parado frente al mostrador: es mejor decirle "no se encontró, llénalo a
// mano" que dejarlo mirando una rueda girando.
const TIMEOUT_MS = 6000;

// Un día. La ficha de un producto de fábrica no cambia de un momento a otro,
// así que volver a escanear el mismo código no tiene por qué volver a molestar
// a un servidor de voluntarios.
const CACHE_SECONDS = 60 * 60 * 24;

type Source = {
  id: string;
  label: string;
  host: string;
  /** Página pública del producto, para poder ir a ver la ficha completa. */
  productUrl: (code: string) => string;
};

// El orden importa: en una tienda de barrio la enorme mayoría de lo que se
// escanea es comida, así que esa base se consulta sola y primero. Las otras dos
// solo entran cuando la primera no encontró nada.
const FOOD: Source = {
  id: "openfoodfacts",
  label: "Open Food Facts",
  host: "world.openfoodfacts.org",
  productUrl: (code) => `https://world.openfoodfacts.org/product/${code}`,
};

const NON_FOOD: Source[] = [
  {
    id: "openbeautyfacts",
    label: "Open Beauty Facts",
    host: "world.openbeautyfacts.org",
    productUrl: (code) => `https://world.openbeautyfacts.org/product/${code}`,
  },
  {
    id: "openproductsfacts",
    label: "Open Products Facts",
    host: "world.openproductsfacts.org",
    productUrl: (code) => `https://world.openproductsfacts.org/product/${code}`,
  },
];

const FIELDS = [
  "code",
  "product_name",
  "product_name_es",
  "generic_name",
  "generic_name_es",
  "brands",
  "quantity",
  "categories_tags",
  "image_front_url",
  "image_url",
].join(",");

export type BarcodeLookup = {
  barcode: string;
  /** Nombre ya armado con marca y presentación, listo para el formulario. */
  name: string;
  brand: string;
  quantity: string;
  /** Categoría de la fuente traducida al español. Es SU clasificación. */
  category: string;
  photo: string | null;
  /** Rastro de dónde salió el dato, para dejarlo escrito en el producto. */
  description: string;
  source: { id: string; label: string; url: string };
};

type OpenFactsProduct = {
  product_name?: string;
  product_name_es?: string;
  generic_name?: string;
  generic_name_es?: string;
  brands?: string;
  quantity?: string;
  categories_tags?: string[];
  image_front_url?: string;
  image_url?: string;
};

/** Acentos y signos fuera para poder comparar textos sin falsos negativos. */
const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const firstNonEmpty = (...values: (string | undefined)[]): string => {
  for (const value of values) {
    const text = (value ?? "").trim();
    if (text) return text;
  }
  return "";
};

/**
 * "Postobon S.A" -> "Postobon". La razón social sobra en el nombre de un
 * producto de mostrador. Solo se quita cuando va al final y después de un
 * espacio, para no mutilar una marca que de verdad se llame así.
 */
const cleanBrand = (raw: string): string =>
  raw
    .split(",")[0]
    .trim()
    .replace(/\s+(s\.?\s?a\.?\s?s?\.?|ltda\.?|inc\.?|llc\.?|s\.?\s?l\.?)$/i, "")
    .trim();

/**
 * "300 g e" -> "300 g". Esa "e" suelta del final es el signo ℮ de cantidad
 * estimada que exige la Unión Europea; en la etiqueta de acá no dice nada.
 */
const cleanQuantity = (raw: string): string =>
  raw.trim().replace(/\s*[e℮]$/i, "").trim();

/**
 * Si el nombre ya carga el número de la presentación no hay que repetirlo:
 * "Agua Pet 600" + "600ml" quedaría como "Agua Pet 600 600ml".
 * Se compara el número suelto y no el texto completo, porque el nombre dice
 * "600" y la presentación "600ml".
 */
function quantityAlreadyInName(name: string, quantity: string): boolean {
  const amount = quantity.match(/\d+([.,]\d+)?/)?.[0];
  if (!amount) return false;
  const target = amount.replace(",", ".");
  return name
    .split(/[^0-9.,]+/)
    .filter(Boolean)
    .some((token) => token.replace(",", ".").replace(/[.,]$/, "") === target);
}

/**
 * Arma el nombre como se escribiría en la lista de la tienda: marca, producto
 * y presentación. Cada pieza entra solo si no está ya dentro del nombre que
 * trae la fuente, que a veces las incluye y a veces no.
 */
function composeName(base: string, brand: string, quantity: string): string {
  const parts: string[] = [];
  const flat = normalize(base);

  if (brand && (!flat || !flat.includes(normalize(brand)))) parts.push(brand);
  if (base) parts.push(base);
  if (
    quantity &&
    (!flat || !flat.includes(normalize(quantity))) &&
    !quantityAlreadyInName(base, quantity)
  ) {
    parts.push(quantity);
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: CACHE_SECONDS },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    // Se cayó la red, se venció el tiempo o contestaron algo que no es JSON.
    // Para quien escanea es lo mismo que no haber encontrado el producto, y el
    // formulario se llena a mano igual.
    return null;
  }
}

/**
 * Las categorías siempre vuelven en inglés ("Table salts"), sin importar el
 * idioma que se pida en la consulta del producto. La traducción real está en
 * el diccionario de categorías, que sí responde en español.
 */
async function translateCategory(
  host: string,
  tags: string[],
): Promise<string> {
  if (!tags.length) return "";

  const url =
    `https://${host}/api/v2/taxonomy?tagtype=categories` +
    `&tags=${encodeURIComponent(tags.join(","))}&lc=es&fields=name`;
  const taxonomy = (await fetchJson(url)) as Record<
    string,
    { name?: Record<string, string> }
  > | null;
  if (!taxonomy) return "";

  // Los tags vienen de lo más general a lo más específico. Se recorre al revés
  // para quedarse con la categoría más precisa que tenga nombre en español:
  // "Aguas" dice más que "Bebidas".
  for (let i = tags.length - 1; i >= 0; i--) {
    const name = taxonomy[tags[i]]?.name?.es?.trim();
    if (name) return name;
  }
  return "";
}

/** El rastro que queda escrito en la descripción del producto. */
function buildDescription(
  code: string,
  source: Source,
  brand: string,
  quantity: string,
  category: string,
): string {
  const today = new Date().toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const details = [
    brand && `Marca: ${brand}`,
    quantity && `Presentación: ${quantity}`,
    category && `Categoría en la fuente: ${category}`,
  ].filter(Boolean);

  return [
    `Datos traídos de ${source.label} el ${today} con el código ${code}.`,
    details.join(" · "),
    "Revisar contra el producto real. El precio, el costo y el stock no vienen de ahí.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function lookupIn(
  source: Source,
  code: string,
): Promise<BarcodeLookup | null> {
  const url = `https://${source.host}/api/v2/product/${code}.json?lc=es&fields=${FIELDS}`;
  const payload = (await fetchJson(url)) as {
    status?: number;
    product?: OpenFactsProduct;
  } | null;

  if (!payload || payload.status !== 1 || !payload.product) return null;
  const raw = payload.product;

  const brand = cleanBrand(raw.brands ?? "");
  const quantity = cleanQuantity(raw.quantity ?? "");
  // El nombre en español manda cuando alguien se tomó el trabajo de cargarlo;
  // si no, el genérico ("BISCUITS FOURRÉS") es mejor que dejarlo vacío.
  const base = firstNonEmpty(
    raw.product_name_es,
    raw.product_name,
    raw.generic_name_es,
    raw.generic_name,
  );
  const name = composeName(base, brand, quantity);
  const photo = firstNonEmpty(raw.image_front_url, raw.image_url) || null;

  // Hay fichas cargadas a medias: existe el código pero no hay ni nombre ni
  // foto. Devolver eso sería peor que decir que no se encontró, porque quien
  // escanea creería que ya tiene algo.
  if (!name && !photo) return null;

  const category = await translateCategory(
    source.host,
    raw.categories_tags ?? [],
  );

  return {
    barcode: code,
    name,
    brand,
    quantity,
    category,
    photo,
    description: buildDescription(code, source, brand, quantity, category),
    source: { id: source.id, label: source.label, url: source.productUrl(code) },
  };
}

/**
 * Busca el código en las bases públicas. Devuelve null cuando ninguna lo tiene,
 * que es un desenlace normal y no un error.
 */
export async function lookupBarcode(code: string): Promise<BarcodeLookup | null> {
  const food = await lookupIn(FOOD, code);
  if (food) return food;

  // Solo si la comida falló se prueban aseo y cosmética, y las dos a la vez
  // para no encadenar dos esperas más.
  const rest = await Promise.all(
    NON_FOOD.map((source) => lookupIn(source, code)),
  );
  return rest.find(Boolean) ?? null;
}
