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
      category: "Sin categoría",
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
