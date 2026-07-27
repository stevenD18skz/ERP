import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ClipboardList, ShoppingCart } from "lucide-react";
import { currency } from "@/utils/converts";
import type { Product } from "@/types/product";
import type { Sale } from "@/types/sale";
import type { Order } from "@/types/order";

export const LOW_STOCK_THRESHOLD = 10;

export const MONTH_LONG = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

// Sin período anterior con qué comparar, un valor nuevo cuenta como +100% y la
// ausencia de movimiento como 0%: así el badge nunca muestra una división por
// cero disfrazada de dato.
export function pctDelta(current: number, previous: number): number {
  if (previous > 0) return ((current - previous) / previous) * 100;
  return current > 0 ? 100 : 0;
}

// "2025-12-31" -> "31 de diciembre de 2025"
export function longDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${d} de ${MONTH_LONG[m - 1]} de ${y}`;
}

// "2025-12-31" -> "31 dic"
export function shortDate(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map(Number);
  return `${d} ${MONTH_LONG[m - 1].slice(0, 3)}`;
}

// Solo la primera letra en mayúscula. La clase capitalize de Tailwind pone en
// mayúscula cada palabra y convertía "Resumen de tu tienda" en "Resumen De Tu
// Tienda", y "26 de julio" en "26 De Julio".
export function sentenceCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export type ActivityItem = {
  icon: LucideIcon;
  accent: string;
  text: string;
  date: string;
};

export type DayBreakdown = {
  date: string;
  ventas: number;
  ganancia: number;
  gasto: number;
  compra: number;
  costo: number;
  neto: number;
};

export function buildActivity(
  productsList: Product[],
  salesList: Sale[],
  ordersList: Order[],
): ActivityItem[] {
  const items: ActivityItem[] = [];

  if (salesList[0]) {
    items.push({
      icon: ShoppingCart,
      accent: "bg-blue-50 text-blue-600",
      text: `Venta registrada por ${currency(salesList[0].total_amount)}`,
      date: salesList[0].sale_date,
    });
  }
  if (ordersList[0]) {
    items.push({
      icon: ClipboardList,
      accent: "bg-indigo-50 text-indigo-600",
      text: `Pedido creado a ${ordersList[0].supplier}`,
      date: ordersList[0].order_date,
    });
  }
  const lowestStock = productsList
    .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock)[0];
  if (lowestStock) {
    items.push({
      icon: AlertTriangle,
      accent: "bg-amber-50 text-amber-600",
      text: `${lowestStock.name} con stock bajo (${lowestStock.stock} un.)`,
      date: lowestStock.created_at,
    });
  }

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);
}
