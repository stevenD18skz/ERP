// Base de datos simulada única para toda la aplicación (demo, en memoria).
// Todas las páginas y servicios deben leer/escribir a través de esto,
// nunca declarar su propio set de datos de ejemplo.
//
// Los datos salen del Excel que llevaba el negocio en 2025 (carpeta Excel_PA).
// Lo que el Excel no registraba, arranca vacío.

import type { Sale, Order } from "@/types";

export { products } from "./data/products.data";
export { dailyCloses } from "./data/dailyCloses.data";
export { expenses } from "./data/expenses.data";

// El Excel anotaba un único total de venta por día, nunca una venta individual:
// no hay líneas de producto, ni método de pago, ni cliente que importar.
// El histórico de 2025 vive en dailyCloses; aquí se acumulan las ventas que se
// registren desde la aplicación de ahora en adelante.
export const sales: Sale[] = [];

// Lo mismo con las compras: el Excel guardaba la columna COMPRA como un total
// diario, sin proveedor ni detalle de qué se pidió. Ese total está en
// dailyCloses.purchases_total; los pedidos con proveedor y líneas empiezan aquí.
export const orders: Order[] = [];
