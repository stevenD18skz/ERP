// Los datos del negocio, en memoria mientras el front no consuma /api.
//
// Salen del Excel que llevaba la tienda en 2025 (carpeta Excel_PA). Lo que el
// Excel no registraba, arranca vacío. Ningún archivo debe declarar su propio
// set de datos de ejemplo aparte de este.
//
// Nadie importa esto directamente salvo src/lib/dataSource.ts: las pantallas
// piden los datos a los servicios, y el dataSource decide si entregar esto o
// los datos falsos del modo simulación (src/lib/simulation).

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
