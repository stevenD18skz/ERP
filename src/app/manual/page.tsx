// Manual de usuario · esqueleto.
//
// Todavía no tiene contenido: lo que hay es el índice de lo que va a explicar,
// para poder ir viendo la forma del manual mientras se escribe. Cada capítulo
// dice de qué va a hablar; el texto se irá llenando capítulo por capítulo.
//
// Cuando se empiece a escribir, lo natural es que cada capítulo pase a ser su
// propia ruta (/manual/productos, /manual/ventas...) y que esta página quede
// como la portada con el índice.

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Store,
  Compass,
  Box,
  ShoppingCart,
  ClipboardList,
  Wallet,
  BarChart3,
  CalendarCheck,
  HelpCircle,
  Type,
  FlaskConical,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Manual de usuario · ERP Supermarket",
  description:
    "Para qué sirve cada sección del sistema y cómo se hace cada tarea del día a día.",
};

type Capitulo = {
  icon: LucideIcon;
  titulo: string;
  proposito: string;
  temas: string[];
};

const CAPITULOS: Capitulo[] = [
  {
    icon: Store,
    titulo: "Qué es este sistema",
    proposito:
      "Qué problema resuelve, a quién le sirve y qué reemplaza del cuaderno y del Excel.",
    temas: [
      "Para qué es la tienda y qué se necesita controlar",
      "Qué hace el sistema y qué no hace",
      "De dónde salieron los datos que ya están cargados",
      "Qué está firme y qué falta por confirmar",
    ],
  },
  {
    icon: Compass,
    titulo: "Primeros pasos",
    proposito: "Cómo moverse por la aplicación sin perderse.",
    temas: [
      "Las partes de la pantalla: barra de arriba, menú de la izquierda",
      "Qué muestra la pantalla de inicio",
      "Cómo practicar con el modo simulación antes de trabajar de verdad",
      "Cómo saber si se está viendo la tienda real o una prueba",
    ],
  },
  {
    icon: Box,
    titulo: "Productos",
    proposito: "Mantener el catálogo al día: qué se vende y a cuánto.",
    temas: [
      "Crear un producto y qué significa cada campo",
      "Precio de venta, costo y por qué algunos costos están marcados",
      "Llevar el inventario y qué hacer con el stock en cero",
      "Buscar, filtrar, cargar varios a la vez y exportar",
    ],
  },
  {
    icon: ShoppingCart,
    titulo: "Ventas",
    proposito: "Registrar lo que se vende, durante el día o al cerrar.",
    temas: [
      "Armar una venta y cobrarla",
      "Efectivo, tarjeta, transferencia y fiado",
      "Poner un descuento en una línea",
      "Anular una venta y cuándo conviene hacerlo",
      "El cierre del día: cuándo usarlo en vez de venta por venta",
    ],
  },
  {
    icon: ClipboardList,
    titulo: "Pedidos a proveedores",
    proposito: "Saber qué se pidió, a quién y cuándo llega.",
    temas: [
      "Crear un pedido y anotar la fecha de entrega",
      "Recibir el pedido y cómo entra la mercancía al inventario",
      "Qué hacer cuando el proveedor no cumple",
      "Cancelar un pedido",
    ],
  },
  {
    icon: Wallet,
    titulo: "Gastos y caja",
    proposito: "Dejar por escrito a dónde se fue la plata que no es mercancía.",
    temas: [
      "Diferencia entre un gasto, una entrada y una salida de caja",
      "Escribir un buen concepto para poder buscarlo después",
      "Revisar los gastos de un mes",
    ],
  },
  {
    icon: BarChart3,
    titulo: "Reportes",
    proposito: "Leer los números del negocio sin ser contador.",
    temas: [
      "Qué significa cada indicador de la pantalla de inicio",
      "Ventas, ganancia, gasto y compra: cómo se relacionan",
      "Comparar un día o un mes con el anterior",
      "El histórico de 2025 y cómo se lee",
    ],
  },
  {
    icon: CalendarCheck,
    titulo: "El día a día",
    proposito: "La rutina completa, de abrir a cerrar.",
    temas: [
      "Al abrir: revisar la caja y lo que se está acabando",
      "Durante el día: vender y anotar los gastos",
      "Al cerrar: cuadrar y guardar el cierre",
      "Una vez por semana: revisar pedidos y precios",
    ],
  },
  {
    icon: HelpCircle,
    titulo: "Problemas comunes",
    proposito: "Qué hacer cuando algo no cuadra.",
    temas: [
      "Me equivoqué en una venta",
      "El inventario no coincide con el estante",
      "El sistema dice que ya existe un cierre para hoy",
      "No carga nada / aparece desconectado",
    ],
  },
  {
    icon: Type,
    titulo: "Palabras del sistema",
    proposito: "Las palabras que usa la aplicación, explicadas sin rodeos.",
    temas: [
      "SKU, código de barras, categoría",
      "Costo, precio, ganancia y margen",
      "Costo estimado y por qué aparece marcado",
      "Cierre diario, fiado, entrada y salida de caja",
    ],
  },
];

export default function ManualPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
            <BookOpen className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Manual de usuario
            </h1>
            <p className="text-sm text-slate-500">
              Para qué sirve cada parte y cómo se usa
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="text-sm font-semibold text-blue-900">
            Todavía se está escribiendo
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-blue-800">
            Por ahora esto es el índice: los capítulos que va a tener el manual
            y de qué va a hablar cada uno. Sirve para ir viendo la forma
            completa antes de escribir el contenido, y para ir apuntando lo que
            falte explicar. El texto se irá llenando capítulo por capítulo.
          </p>
        </div>
      </header>

      <section aria-labelledby="indice" className="mt-8">
        <h2 id="indice" className="text-lg font-semibold text-slate-900">
          Índice
        </h2>

        <ol className="mt-4 space-y-3">
          {CAPITULOS.map((capitulo, i) => (
            <li key={capitulo.titulo}>
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
                    aria-hidden
                  >
                    <capitulo.icon className="h-[18px] w-[18px]" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h3 className="font-semibold text-slate-900">
                        <span className="tabular-nums text-slate-400">
                          {String(i + 1).padStart(2, "0")}.
                        </span>{" "}
                        {capitulo.titulo}
                      </h3>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        Pendiente
                      </span>
                    </div>

                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {capitulo.proposito}
                    </p>

                    <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                      {capitulo.temas.map((tema) => (
                        <li
                          key={tema}
                          className="flex gap-2 text-[13px] leading-relaxed text-slate-500"
                        >
                          <span
                            className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300"
                            aria-hidden
                          />
                          <span>{tema}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 rounded-xl border border-teal-200 bg-teal-50/60 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-teal-900">
          <FlaskConical className="h-4 w-4" aria-hidden />
          Mientras tanto, se puede practicar
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-teal-800">
          El modo simulación abre la aplicación con una tienda inventada. Es la
          forma de ir probando cada sección sin miedo a dañar la información de
          la tienda, y sin esperar a que el manual esté listo.
        </p>
        <Link
          href="/simulacion"
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          Abrir la simulación
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
