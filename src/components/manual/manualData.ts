import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Box,
  CalendarCheck,
  ClipboardList,
  Compass,
  HelpCircle,
  ShoppingCart,
  Store,
  Type,
  Wallet,
} from "lucide-react";

export type Capitulo = { icon: LucideIcon; id: string; titulo: string };

// El orden de esta lista es el del índice y el de los capítulos en la página:
// el número que se ve en pantalla sale de la posición, no está escrito aparte.
export const CAPITULOS: Capitulo[] = [
  { icon: Store, id: "que-es", titulo: "Qué es este sistema" },
  { icon: Compass, id: "primeros-pasos", titulo: "Primeros pasos" },
  { icon: Box, id: "productos", titulo: "Productos" },
  { icon: ShoppingCart, id: "ventas", titulo: "Ventas" },
  { icon: ClipboardList, id: "pedidos", titulo: "Pedidos a proveedores" },
  { icon: Wallet, id: "gastos", titulo: "Gastos y caja" },
  { icon: BarChart3, id: "reportes", titulo: "Reportes" },
  { icon: CalendarCheck, id: "dia-a-dia", titulo: "El día a día" },
  { icon: HelpCircle, id: "problemas", titulo: "Problemas comunes" },
  { icon: Type, id: "glosario", titulo: "Palabras del sistema" },
];
