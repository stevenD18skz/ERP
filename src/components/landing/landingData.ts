import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Barcode,
  BookOpen,
  Box,
  ClipboardList,
  Clock,
  Eye,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";

// Contenido de la página pública. Es material de promoción: habla de lo que la
// aplicación hace y de lo que le aporta a un negocio, en general. Nunca de la
// contabilidad, las ventas ni los datos de ninguna tienda concreta — eso es
// información privada de quien la usa y no va en una página abierta a internet.

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
      "El catálogo completo: qué vendes, a cuánto y cuánto te queda en el estante.",
    puntos: [
      "Precio, costo y margen calculado de cada producto",
      "Aviso automático cuando algo se está acabando",
      "Búsqueda por nombre, código interno o código de barras",
      "Carga masiva desde CSV y exportación cuando la necesites",
    ],
    href: "/products",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    icon: ShoppingCart,
    titulo: "Ventas",
    proposito: "Un punto de venta que cobra rápido y descuenta el inventario solo.",
    puntos: [
      "Arma la venta, cobra y el stock baja en el mismo movimiento",
      "Efectivo con cálculo de vuelto, tarjeta, transferencia o fiado",
      "Descuentos por línea, en porcentaje o en monto",
      "Recibo imprimible y anulación que devuelve el stock",
    ],
    href: "/sales",
    accent: "bg-teal-50 text-teal-600",
  },
  {
    icon: ClipboardList,
    titulo: "Pedidos",
    proposito: "Lo que le encargas a cada proveedor y cuándo debería llegar.",
    puntos: [
      "Pedido con proveedor, fecha de entrega y notas",
      "Marca sola los pedidos que se pasaron de la fecha",
      "Al recibirlo, la mercancía entra al inventario sin escribir nada",
      "Historial por proveedor para comparar quién te cumple",
    ],
    href: "/orders",
    accent: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Wallet,
    titulo: "Gastos y caja",
    proposito: "A dónde se va la plata que no es mercancía.",
    puntos: [
      "Cada gasto con su concepto, no un total suelto",
      "Entradas y salidas de caja por fuera de las ventas",
      "Filtros por tipo, mes y año",
      "Neto del período, para saber si el mes cerró en verde",
    ],
    href: "/expenses",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    icon: BarChart3,
    titulo: "Reportes",
    proposito: "Si el negocio va bien, en números y no de memoria.",
    puntos: [
      "Ventas, ganancia, gastos y compras por día y por mes",
      "Comparación automática contra el período anterior",
      "Gráficas del período que puedes abrir día por día",
      "Descarga en CSV para llevarlo al contador",
    ],
    href: "/summary",
    accent: "bg-violet-50 text-violet-600",
  },
  {
    icon: BookOpen,
    titulo: "Manual",
    proposito: "Cómo se usa cada parte, escrito para quien atiende el mostrador.",
    puntos: [
      "Para qué sirve cada sección, sin tecnicismos",
      "Paso a paso de las tareas del día",
      "Qué hacer cuando aparece un aviso raro",
      "Glosario de las palabras que usa el sistema",
    ],
    href: "/manual",
    accent: "bg-slate-100 text-slate-600",
  },
];

export type Beneficio = {
  icon: LucideIcon;
  titulo: string;
  texto: string;
  accent: string;
};

// El "para qué" antes del "qué": qué cambia en el negocio, no qué botones trae.
export const BENEFICIOS: Beneficio[] = [
  {
    icon: Eye,
    titulo: "Deja de adivinar qué hay en el estante",
    texto:
      "El inventario se mueve solo cuando vendes y cuando recibes un pedido. Sabes qué se está acabando antes de que un cliente te lo pida y no lo tengas.",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    icon: TrendingUp,
    titulo: "Sabes cuánto ganas, no solo cuánto vendes",
    texto:
      "Cada producto lleva su costo, así que la ganancia sale sola en cada venta y en cada corte del mes. Vender mucho y ganar poco deja de ser una sorpresa.",
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Clock,
    titulo: "El cierre del día deja de ser una hora de cuentas",
    texto:
      "Lo que registraste durante el día ya está sumado. Y si un día no alcanzaste a registrar venta por venta, puedes dejar solo el total, como en el cuaderno.",
    accent: "bg-amber-50 text-amber-600",
  },
  {
    icon: Barcode,
    titulo: "Cobra con lector de código de barras",
    texto:
      "Funciona con cualquier lector que se comporte como teclado, incluido tu celular con una app gratuita. Escaneas y el producto entra al carrito.",
    accent: "bg-violet-50 text-violet-600",
  },
];

export type Paso = { titulo: string; texto: string };

export const PASOS: Paso[] = [
  {
    titulo: "Carga tu catálogo",
    texto:
      "Producto por producto o subiendo un CSV con todo de una vez. Si tienes lector, el código de barras trae parte de la ficha solo.",
  },
  {
    titulo: "Vende y registra",
    texto:
      "Cobras desde el punto de venta y el inventario se ajusta en el momento. Los gastos y los pedidos se anotan a medida que pasan.",
  },
  {
    titulo: "Mira cómo va el negocio",
    texto:
      "Inicio te resume el día apenas abres. Reportes te muestra el período completo y lo compara contra el anterior.",
  },
];

export const SIMULACION_PUNTOS = [
  "Se puede vender, editar, borrar y cerrar el día: todo funciona de verdad",
  "Los cambios aguantan recargar la página y moverse entre secciones",
  "Se borra solo al cerrar la pestaña, y hay un botón para reiniciarla",
  "No necesitas crear una cuenta ni dar ningún dato para entrar",
];
