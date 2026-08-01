// Catálogo de productos.
//
// En simulación sigue igual que siempre: mutando el array del mock. Fuera de
// simulación pega al /api real (ver src/lib/dataSource.ts para el porqué del
// interruptor).

import { collection, commit, isSimulationOn } from "../lib/dataSource";
import { apiFetch, apiFetchAll } from "../lib/api/client";

const all = () => collection("products");

const sameId = (a, b) => String(a) === String(b);

export const getProducts = async () => {
  if (isSimulationOn()) return [...all()];
  return apiFetchAll("/api/products");
};

export const getProductById = async (id) => {
  if (isSimulationOn()) {
    const product = all().find((p) => sameId(p.id, id));
    if (!product) throw new Error("Product not found");
    return product;
  }
  const { data } = await apiFetch(`/api/products/${id}`);
  return data;
};

export const createProduct = async (product) => {
  if (isSimulationOn()) {
    const products = all();
    const created = {
      id: `p${Date.now()}`,
      created_at: new Date().toISOString(),
      barcode: "",
      photo: null,
      stock: 0,
      // Vacío y no "Sin categoría": el texto que se lee cuando no hay ninguna
      // lo pone la pantalla, igual que hace el mapper de la API.
      category: "",
      category_id: null,
      brand: "",
      brand_id: null,
      description: "",
      cost_is_estimated: false,
      ...product,
    };
    products.push(created);
    commit("products");
    return created;
  }
  const { data } = await apiFetch("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
  return data;
};

export const updateProduct = async (id, changes) => {
  if (isSimulationOn()) {
    const product = all().find((p) => sameId(p.id, id));
    if (!product) throw new Error("Product not found");
    Object.assign(product, changes);
    commit("products");
    return product;
  }
  const { data } = await apiFetch(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
  return data;
};

/* --- categorías y marcas -------------------------------------------------
   Las dos son tablas propias en Supabase, así que el catálogo completo se pide
   aparte: incluye las que todavía no tienen ningún producto adentro, que es lo
   que hace que crear una categoría y usarla después sea posible.

   En simulación no hay base, así que se deducen de los productos que hay
   cargados; ahí una categoría vive solo mientras algún producto la nombre, y
   está bien: la simulación se borra al cerrar la pestaña.

   Las dos formas salen normalizadas a { id, name, product_count } para que la
   pantalla no tenga que saber de cuál de los dos lados vino. */

const deriveFromProducts = (field) => {
  const byName = new Map();
  for (const product of all()) {
    const name = String(product[field] ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const found = byName.get(key);
    if (found) found.product_count += 1;
    else byName.set(key, { id: null, name, product_count: 1 });
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
};

export const getCategories = async () => {
  if (isSimulationOn()) return deriveFromProducts("category");
  const { data } = await apiFetch("/api/products/categories");
  return (data || []).map((row) => ({
    id: row.category_id,
    name: row.category,
    product_count: row.product_count,
  }));
};

export const getBrands = async () => {
  if (isSimulationOn()) return deriveFromProducts("brand");
  const { data } = await apiFetch("/api/products/brands");
  return (data || []).map((row) => ({
    id: row.brand_id,
    name: row.brand,
    product_count: row.product_count,
  }));
};

// Mismas reglas que valida el servidor (src/app/api/products/photo/route.ts).
// Se repiten acá para poder avisar al instante, sin esperar la subida, y
// para poder mostrarlas como ayuda fija en el formulario.
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
export const PHOTO_REQUIREMENTS_LABEL = "JPEG, PNG, WEBP o GIF · máximo 5MB";

function validatePhotoFile(file) {
  if (!PHOTO_ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Ese archivo es ${file.type || "de un tipo no reconocido"}. La foto debe ser JPEG, PNG, WEBP o GIF.`,
    );
  }
  if (file.size > PHOTO_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `La foto pesa ${mb}MB y el máximo permitido es 5MB. Prueba con una foto de menor resolución o comprímela antes de subirla.`,
    );
  }
}

// Sube la foto que la tienda toma o elige (no la del catálogo público, esa ya
// llega como URL) y devuelve dónde quedó guardada. No pasa por apiFetch
// porque ese fuerza Content-Type: application/json; con FormData hay que
// dejar que el navegador ponga su propio boundary de multipart.
export const uploadProductPhoto = async (file) => {
  validatePhotoFile(file);

  if (isSimulationOn()) {
    // Sin backend a mano: se guarda tal cual como URL de datos, igual que
    // antes. Solo vive mientras dure la pestaña, como el resto de la
    // simulación.
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  const form = new FormData();
  form.append("file", file);

  let res;
  try {
    res = await fetch("/api/products/photo", { method: "POST", body: form });
  } catch {
    // fetch solo rechaza así por red caída/CORS, no por lo que responda el
    // servidor: eso ya lo cubre la rama de abajo.
    throw new Error(
      "No se pudo conectar con el servidor para subir la foto. Revisa tu conexión a internet e inténtalo de nuevo.",
    );
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (!body) {
      throw new Error(
        `El servidor respondió con un error inesperado (${res.status}) al subir la foto. Inténtalo de nuevo en un momento.`,
      );
    }
    throw new Error(body?.error?.message ?? "No se pudo subir la foto");
  }
  return body.data.url;
};

export const deleteProduct = async (id) => {
  if (isSimulationOn()) {
    const products = all();
    const index = products.findIndex((p) => sameId(p.id, id));
    if (index === -1) throw new Error("Product not found");
    products.splice(index, 1);
    commit("products");
    return { message: "Product deleted" };
  }
  await apiFetch(`/api/products/${id}`, { method: "DELETE" });
  return { message: "Product deleted" };
};
