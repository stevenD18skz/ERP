"use client";

import { AlertTriangle } from "lucide-react";
import { LOW_STOCK_THRESHOLD } from "./productsUtils";

// Aviso al lado del nombre. No se muestra nada cuando hay stock de sobra: una
// etiqueta verde en cada fila sería ruido en una tabla de 435 productos.
export default function StockBadge({ stock }) {
  if (stock > LOW_STOCK_THRESHOLD) return null;
  return (
    <span className=" inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
      <AlertTriangle className="h-2.5 w-2.5" />
      {stock === 0 ? "Agotado" : "Stock bajo"}
    </span>
  );
}
