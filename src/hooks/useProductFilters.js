"use client";

import { useEffect, useMemo, useState } from "react";
import { currency } from "@/utils/converts";
import { getMargin } from "@/components/products/productsUtils";

// Búsqueda, filtros, orden y paginación del catálogo. Vive aparte de la página
// porque es lógica sin pantalla: recibe la lista de productos y devuelve la
// porción que toca dibujar, más los controles para moverla.
export function useProductFilters(products, { perPage = 8 } = {}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState([]); // multi-select
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stockOp, setStockOp] = useState("any"); // any, lt, gt, eq
  const [stockVal, setStockVal] = useState("");

  const [sortBy, setSortBy] = useState(null); // name|category|price|cost_price|margin|stock
  const [sortDir, setSortDir] = useState("asc");

  const [page, setPage] = useState(1);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(products.map((p) => p.category || "Otros"))),
    ],
    [products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.slice();

    if (categoryFilter.length > 0 && !categoryFilter.includes("All")) {
      list = list.filter((p) => categoryFilter.includes(p.category));
    }

    if (q) {
      list = list.filter((p) =>
        [p.name, p.sku, p.barcode, p.category, p.description].some((f) =>
          (f || "").toLowerCase().includes(q),
        ),
      );
    }

    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (!Number.isNaN(min) && minPrice !== "")
      list = list.filter((p) => p.price >= min);
    if (!Number.isNaN(max) && maxPrice !== "")
      list = list.filter((p) => p.price <= max);

    const sVal = Number(stockVal);
    if (stockOp !== "any" && !Number.isNaN(sVal)) {
      if (stockOp === "lt") list = list.filter((p) => p.stock < sVal);
      if (stockOp === "gt") list = list.filter((p) => p.stock > sVal);
      if (stockOp === "eq") list = list.filter((p) => p.stock === sVal);
    }

    // El margen no es una columna de la base: se calcula, así que se ordena
    // aparte. Sin orden elegido, alfabético por nombre.
    if (sortBy) {
      list.sort((a, b) => {
        const aVal = sortBy === "margin" ? getMargin(a) : a[sortBy];
        const bVal = sortBy === "margin" ? getMargin(b) : b[sortBy];
        if (typeof aVal === "string") {
          return sortDir === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      });
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [
    products,
    query,
    categoryFilter,
    minPrice,
    maxPrice,
    stockOp,
    stockVal,
    sortBy,
    sortDir,
  ]);

  const activeFilterCount =
    (categoryFilter.length > 0 ? 1 : 0) +
    (minPrice !== "" ? 1 : 0) +
    (maxPrice !== "" ? 1 : 0) +
    (stockOp !== "any" && stockVal !== "" ? 1 : 0);
  const hasActiveSearch = query.trim() !== "" || activeFilterCount > 0;

  const filterChips = useMemo(() => {
    const chips = [];
    categoryFilter.forEach((c) =>
      chips.push({
        key: `cat-${c}`,
        label: c,
        onRemove: () =>
          setCategoryFilter((prev) => prev.filter((x) => x !== c)),
      }),
    );
    if (minPrice !== "")
      chips.push({
        key: "min",
        label: `Desde ${currency(Number(minPrice))}`,
        onRemove: () => setMinPrice(""),
      });
    if (maxPrice !== "")
      chips.push({
        key: "max",
        label: `Hasta ${currency(Number(maxPrice))}`,
        onRemove: () => setMaxPrice(""),
      });
    if (stockOp !== "any" && stockVal !== "") {
      const opLabel =
        stockOp === "lt"
          ? "menor que"
          : stockOp === "gt"
            ? "mayor que"
            : "igual a";
      chips.push({
        key: "stock",
        label: `Stock ${opLabel} ${stockVal}`,
        onRemove: () => {
          setStockOp("any");
          setStockVal("");
        },
      });
    }
    return chips;
  }, [categoryFilter, minPrice, maxPrice, stockOp, stockVal]);

  const clearAllFilters = () => {
    setQuery("");
    setCategoryFilter([]);
    setMinPrice("");
    setMaxPrice("");
    setStockOp("any");
    setStockVal("");
  };

  // La búsqueda de texto vuelve a la página 1 en su propio setter; el resto de
  // los filtros, aquí.
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, minPrice, maxPrice, stockOp, stockVal]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  // Si se filtró tanto que la página actual ya no existe, hay que retroceder o
  // la tabla queda en blanco sin explicación.
  useEffect(() => {
    setPage((p) => (p > totalPages ? totalPages : p));
  }, [totalPages]);

  const pageItems = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage],
  );

  const changeQuery = (value) => {
    setQuery(value);
    setPage(1);
  };

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  return {
    // valores
    query,
    categoryFilter,
    minPrice,
    maxPrice,
    stockOp,
    stockVal,
    sortBy,
    sortDir,
    page,
    perPage,
    // derivados
    categories,
    filtered,
    pageItems,
    totalPages,
    activeFilterCount,
    hasActiveSearch,
    filterChips,
    // acciones
    setQuery: changeQuery,
    setCategoryFilter,
    setMinPrice,
    setMaxPrice,
    setStockOp,
    setStockVal,
    setPage,
    toggleSort,
    clearAllFilters,
  };
}

export default useProductFilters;
