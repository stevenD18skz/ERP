"use client";

// Cache del catálogo de productos (productos, categorías y marcas) para la
// pantalla de /products, con SWR.
//
// Antes cada vez que se montaba la página —incluso solo yendo a otra pestaña
// del panel y volviendo— se volvían a pedir las tres cosas a Supabase y la
// pantalla se quedaba en el esqueleto de carga hasta que contestaban. Con SWR
// el pedido se hace una sola vez por sesión del navegador: si ya hay datos en
// caché se pintan de una, y solo se vuelve a pedir cuando algo lo pide de
// verdad —el botón "Actualizar" (ver `refresh`/`refreshTaxonomies`) o después
// de guardar algo—, nunca por el solo hecho de volver a entrar a la página.
//
// `revalidateIfStale/OnFocus/OnReconnect: false` es lo que apaga esas
// revalidaciones automáticas; `shouldRetryOnError: false` evita que un error
// (por ejemplo la sesión vencida) dispare reintentos solos en cadena.
import useSWR from "swr";
import {
  getProducts,
  getCategories,
  getBrands,
} from "@/services/products.service";

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: false,
};

export function useProductsCatalog() {
  const productsSWR = useSWR("products", getProducts, swrOptions);
  const categoriesSWR = useSWR(
    "product-categories",
    getCategories,
    swrOptions,
  );
  const brandsSWR = useSWR("product-brands", getBrands, swrOptions);

  // Fuerza a volver a pedir las tres cosas (botón "Actualizar").
  const refresh = () =>
    Promise.all([
      productsSWR.mutate(),
      categoriesSWR.mutate(),
      brandsSWR.mutate(),
    ]);

  // Solo categorías y marcas: se usa después de crear/editar un producto o
  // importar un CSV, que es lo único que puede haber agregado una categoría o
  // marca nueva.
  const refreshTaxonomies = () =>
    Promise.all([categoriesSWR.mutate(), brandsSWR.mutate()]);

  return {
    products: productsSWR.data ?? [],
    categories: categoriesSWR.data ?? [],
    brands: brandsSWR.data ?? [],
    // Solo verdadero mientras no hay datos todavía (primera carga real, sin
    // caché). Una revalidación en segundo plano con datos ya en pantalla no
    // debe volver a mostrar el esqueleto de carga.
    loading: productsSWR.isLoading,
    // Verdadero durante cualquier pedido en curso, incluida una
    // revalidación: para el ícono del botón "Actualizar".
    refreshing: productsSWR.isValidating,
    productsError: productsSWR.error,
    // Actualiza el catálogo en memoria sin pedirle nada a Supabase (updates
    // optimistas, o pintar la respuesta real después de guardar). Mismo uso
    // que un setState: acepta el valor nuevo o una función (lista actual) =>
    // lista nueva.
    setProducts: (updater) =>
      productsSWR.mutate(updater, { revalidate: false }),
    refresh,
    refreshTaxonomies,
  };
}

export default useProductsCatalog;
