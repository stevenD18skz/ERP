import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Box,
  ClipboardList,
  ShoppingCart,
  Wallet,
} from "lucide-react";

export type Modulo = {
  icon: LucideIcon;
  titulo: string;
  proposito: string;
  puntos: string[];
  href: string;
  accent: string;
};

export const MODULOS: Modulo[] = [
  {
    icon: Box,
    titulo: "Productos",
    proposito:
      "El catálogo de la tienda: qué se vende, a cuánto y cuánto queda.",
    puntos: [
      "Precio de venta y costo de cada producto",
      "Inventario, con aviso cuando algo se está acabando",
      "Búsqueda por nombre, SKU, código de barras o categoría",
      "Carga de varios productos a la vez y exportación a CSV",
    ],
    href: "/products",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    icon: ShoppingCart,
    titulo: "Ventas",
    proposito: "Registrar lo que se vende, venta por venta o el total del día.",
    puntos: [
      "Punto de venta: se arma la venta, se cobra y baja el inventario",
      "Efectivo, tarjeta, transferencia o fiado con nombre del cliente",
      "Descuentos por porcentaje o por monto en cada línea",
      "Cierre diario, para seguir trabajando como en el cuaderno",
    ],
    href: "/sales",
    accent: "bg-teal-50 text-teal-600",
  },
  {
    icon: ClipboardList,
    titulo: "Pedidos",
    proposito: "Lo que se le encarga a cada proveedor y cuándo llega.",
    puntos: [
      "Pedido con proveedor, fecha de entrega y notas",
      "Aviso cuando la entrega se pasó de la fecha",
      "Al recibir, la mercancía entra sola al inventario",
      "Historial por proveedor para comparar precios",
    ],
    href: "/orders",
    accent: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Wallet,
    titulo: "Gastos y caja",
    proposito: "A dónde se va la plata que no es mercancía.",
    puntos: [
      "Gastos del negocio con su concepto",
      "Entradas y salidas de caja por fuera de las ventas",
      "Filtros por tipo, mes y año",
      "Totales para saber cuánto se gastó en el periodo",
    ],
    href: "/expenses",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    icon: BarChart3,
    titulo: "Reportes",
    proposito: "Si el negocio está yendo bien, en números y no de memoria.",
    puntos: [
      "Ventas, ganancia, gastos y compras por día y por mes",
      "Comparación contra los días anteriores",
      "Histórico completo de 2025 traído del Excel",
      "Productos con más movimiento",
    ],
    href: "/summary",
    accent: "bg-violet-50 text-violet-600",
  },
  {
    icon: BookOpen,
    titulo: "Manual",
    proposito:
      "Cómo se usa cada parte, explicado para quien atiende la tienda.",
    puntos: [
      "Para qué sirve cada sección",
      "Paso a paso de las tareas del día",
      "Qué hacer cuando algo sale mal",
      "En construcción: se irá llenando sobre la marcha",
    ],
    href: "/manual",
    accent: "bg-slate-100 text-slate-600",
  },
];

// Cifras reales del Excel de contabilidad de 2025 que se importó al proyecto.
// Si el Excel cambia, hay que actualizarlas: no son de adorno.
export const CIFRAS = [
  { valor: "435", etiqueta: "productos en el catálogo" },
  { valor: "365", etiqueta: "días de 2025 registrados" },
  { valor: "$154.490.050", etiqueta: "en ventas del año pasado" },
];

export const SIMULACION_PUNTOS = [
  "Se puede vender, editar, borrar y cerrar el día, todo funciona",
  "Los cambios aguantan recargar la página y moverse entre secciones",
  "Se borra solo al cerrar la pestaña; también hay botón para reiniciar",
  "La información de la tienda no se toca en ningún momento",
];
