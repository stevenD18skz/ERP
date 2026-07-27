// Página pública: la puerta de entrada.
//
// Se renderiza en el servidor (no lleva "use client") porque es solo texto y
// enlaces: entre más liviana, más rápido abre.
//
// Las cifras que aparecen aquí son las del Excel de contabilidad de 2025 que se
// importó al proyecto, no son de adorno: 435 productos, 365 días registrados y
// $154.490.050 vendidos. Si el Excel cambia, hay que actualizarlas.

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Box,
  ShoppingCart,
  ClipboardList,
  Wallet,
  BarChart3,
  BookOpen,
  FlaskConical,
  ArrowRight,
  Check,
  Database,
  ShieldCheck,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";

export const metadata = {
  title: "Boxes · Everything in one box",
  description:
    "Boxes — administración para una tienda de barrio: catálogo, ventas, pedidos, gastos y reportes. Se puede probar con datos de ejemplo antes de usarlo.",
};

type Modulo = {
  icon: LucideIcon;
  titulo: string;
  proposito: string;
  puntos: string[];
  href: string;
  accent: string;
};

const MODULOS: Modulo[] = [
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

const CIFRAS = [
  { valor: "435", etiqueta: "productos en el catálogo" },
  { valor: "365", etiqueta: "días de 2025 registrados" },
  { valor: "$154.490.050", etiqueta: "en ventas del año pasado" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ------------------------------------------------ barra superior --- */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
          <img
            src="/Boxes_logo.png"
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-800">
              Boxes
            </span>
            <span className="hidden text-[11px] text-slate-500 sm:block">
              Everything in one box
            </span>
          </span>

          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              href="/manual"
              className="hidden min-h-[40px] items-center rounded-md px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:flex"
            >
              Manual
            </Link>
            <Link
              href="/simulacion"
              className="flex min-h-[40px] items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <FlaskConical className="h-4 w-4 text-teal-600" aria-hidden />
              Simular
            </Link>
            <Link
              href="/dashboard"
              className="flex min-h-[40px] items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* -------------------------------------------------------- hero --- */}
        <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
            <p className="text-sm font-semibold text-blue-600">
              Administración para tienda de barrio
            </p>

            <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl">
              El control de la tienda en un solo lugar
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
              Qué hay en el estante, qué se vendió hoy, qué se le debe a cada
              proveedor y en qué se fue la plata del mes. Todo eso vivía
              repartido entre un cuaderno y una hoja de cálculo; acá está junto,
              al día y sin fórmulas que se rompan.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/dashboard"
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Entrar a la aplicación
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>

              <Link
                href="/simulacion"
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 text-[15px] font-semibold text-slate-700 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                <FlaskConical className="h-4 w-4 text-teal-600" aria-hidden />
                Simula el funcionamiento
              </Link>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              La simulación abre la aplicación completa con datos inventados. No
              toca la información de la tienda.
            </p>

            {/* Cifras reales del archivo que se importó */}
            <dl className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {CIFRAS.map((cifra) => (
                <div
                  key={cifra.etiqueta}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <dt className="sr-only">{cifra.etiqueta}</dt>
                  <dd>
                    <span className="block text-2xl font-bold tabular-nums text-slate-900 md:text-3xl">
                      {cifra.valor}
                    </span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {cifra.etiqueta}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ------------------------------------------------ de dónde sale --- */}
        <section
          aria-labelledby="origen"
          className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16"
        >
          <h2
            id="origen"
            className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl"
          >
            No empezó en cero
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            El sistema se armó a partir del archivo de contabilidad que ya
            llevaba la tienda durante 2025. Todo lo que ese archivo registraba
            está adentro; lo que nunca registró, está señalado como pendiente en
            vez de rellenado a la fuerza.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <Database className="h-5 w-5 text-blue-600" aria-hidden />
              <h3 className="mt-3 font-semibold text-slate-900">
                Lo que se trajo
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Los 435 productos con su precio, y los 365 días del año con su
                venta, ganancia, gasto y compra. Los totales cuadran con los del
                archivo, mes por mes.
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <CalendarClock className="h-5 w-5 text-teal-600" aria-hidden />
              <h3 className="mt-3 font-semibold text-slate-900">
                Lo que cambia desde ahora
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                El archivo guardaba un solo total por día. De aquí en adelante
                se puede registrar venta por venta, con productos, forma de pago
                y cliente, sin dejar de poder cerrar el día como antes.
              </p>
            </article>

            <article className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden />
              <h3 className="mt-3 font-semibold text-slate-900">
                Lo que queda pendiente
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                El inventario arranca en cero porque el archivo nunca lo llevó:
                hay que contar. Y 398 productos tienen el costo calculado a
                partir del precio, no de una factura; la aplicación los muestra
                marcados para poder corregirlos.
              </p>
            </article>
          </div>
        </section>

        {/* ---------------------------------------------------- módulos --- */}
        <section
          aria-labelledby="modulos"
          className="border-y border-slate-100 bg-slate-50"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
            <h2
              id="modulos"
              className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl"
            >
              Qué trae por dentro
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Seis secciones, cada una con un trabajo concreto del día a día.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {MODULOS.map((modulo) => (
                <article
                  key={modulo.titulo}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${modulo.accent}`}
                  >
                    <modulo.icon className="h-5 w-5" aria-hidden />
                  </span>

                  <h3 className="mt-4 text-lg font-semibold text-slate-900">
                    {modulo.titulo}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {modulo.proposito}
                  </p>

                  <ul className="mt-4 flex-1 space-y-2">
                    {modulo.puntos.map((punto) => (
                      <li
                        key={punto}
                        className="flex gap-2 text-sm text-slate-600"
                      >
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-teal-600"
                          aria-hidden
                        />
                        <span>{punto}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={modulo.href}
                    className="mt-5 flex min-h-[40px] items-center gap-1 self-start text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    Abrir {modulo.titulo.toLowerCase()}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- simulación --- */}
        <section
          aria-labelledby="simulacion"
          className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16"
        >
          <div className="overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white">
            <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-5 md:p-10">
              <div className="md:col-span-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-teal-300 bg-white px-3 py-1 text-xs font-semibold text-teal-700">
                  <FlaskConical className="h-3.5 w-3.5" aria-hidden />
                  Modo simulación
                </span>

                <h2
                  id="simulacion"
                  className="mt-4 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl"
                >
                  Pruébala sin miedo a dañar nada
                </h2>

                <p className="mt-3 leading-relaxed text-slate-600">
                  Abre la aplicación completa —las mismas pantallas, los mismos
                  botones— pero con una tienda inventada: 22 productos, unas
                  ventas del día, cuatro pedidos y dos semanas de cierres. Sirve
                  para aprender a usarla, para mostrarla, o para ensayar algo
                  antes de hacerlo de verdad.
                </p>

                <ul className="mt-6 space-y-2.5">
                  {[
                    "Se puede vender, editar, borrar y cerrar el día, todo funciona",
                    "Los cambios aguantan recargar la página y moverse entre secciones",
                    "Se borra solo al cerrar la pestaña; también hay botón para reiniciar",
                    "La información de la tienda no se toca en ningún momento",
                  ].map((punto) => (
                    <li
                      key={punto}
                      className="flex gap-2.5 text-sm text-slate-700"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-teal-600"
                        aria-hidden
                      />
                      <span>{punto}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/simulacion"
                  className="mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-teal-600 px-6 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                >
                  Simula el funcionamiento
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <div className="md:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ShieldCheck
                      className="h-4 w-4 text-teal-600"
                      aria-hidden
                    />
                    Cómo se distingue
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Mientras la simulación está encendida, un aviso amarillo
                    acompaña todas las pantallas. Si no está ese aviso, lo que
                    se ve es la tienda de verdad.
                  </p>

                  <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
                    <p className="text-xs leading-relaxed text-amber-900">
                      <span className="font-semibold">Modo simulación.</span>{" "}
                      Datos de prueba: nada de lo que hagas aquí toca la
                      información de la tienda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ manual --- */}
        <section className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-6">
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                <BookOpen className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Manual de usuario
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
                  Para qué es cada sección y cómo se hace cada tarea, escrito
                  para quien atiende la tienda. Está en construcción: por ahora
                  se puede ver el índice de lo que va a explicar.
                </p>
              </div>
            </div>

            <Link
              href="/manual"
              className="flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Ver el manual
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      {/* --------------------------------------------------------- pie --- */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
          <p>Boxes · Everything in one box — administración para la tienda</p>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Aplicación
            </Link>
            <Link
              href="/simulacion"
              className="hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Simulación
            </Link>
            <Link
              href="/manual"
              className="hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Manual
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
