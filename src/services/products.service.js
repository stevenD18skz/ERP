// Catálogo de productos.
//
// Los datos salen de dataSource, que decide solo si la aplicación está usando
// los datos del negocio o los de la simulación. Este archivo no tiene que
// saber en cuál de los dos está.

import { collection, commit } from "../lib/dataSource";

const all = () => collection("products");

const sameId = (a, b) => String(a) === String(b);

export const getProducts = async () => {
  // Copia del arreglo (no de los objetos): React necesita una referencia nueva
  // para volver a pintar, pero editar un producto debe seguir tocando el
  // original guardado.
  return [...all()];
};

export const getProductById = async (id) => {
  const product = all().find((p) => sameId(p.id, id));
  if (!product) throw new Error("Product not found");
  return product;
};

export const createProduct = async (product) => {
  const products = all();
  const created = {
    id: `p${Date.now()}`,
    created_at: new Date().toISOString(),
    barcode: "",
    photo: null,
    stock: 0,
    category: "Sin categoría",
    description: "",
    cost_is_estimated: false,
    ...product,
  };
  products.push(created);
  commit("products");
  return created;
};

export const updateProduct = async (id, changes) => {
  const product = all().find((p) => sameId(p.id, id));
  if (!product) throw new Error("Product not found");
  Object.assign(product, changes);
  commit("products");
  return product;
};

export const deleteProduct = async (id) => {
  const products = all();
  const index = products.findIndex((p) => sameId(p.id, id));
  if (index === -1) throw new Error("Product not found");
  products.splice(index, 1);
  commit("products");
  return { message: "Product deleted" };
};
