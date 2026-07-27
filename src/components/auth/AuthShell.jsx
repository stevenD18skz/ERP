"use client";

import Link from "next/link";
import { ArrowLeft, Check, FlaskConical } from "lucide-react";

const PUNTOS = [
  "Inventario que se mueve solo al vender y al recibir mercancía",
  "Punto de venta con vuelto, fiado y recibo imprimible",
  "Gastos, pedidos y reportes del negocio en el mismo lugar",
];

// Armazón de las pantallas de sesión: panel de marca a la izquierda y el
// formulario a la derecha.
//
// El panel se esconde por debajo de lg: en un teléfono le quitaría la pantalla
// al formulario, que es a lo que se vino. La salida hacia atrás sí se queda
// siempre visible — entrar a /login desde el menú y quedarse encerrado sin
// forma de volver era justo lo que faltaba.
export default function AuthShell({
  accent = "blue",
  title,
  subtitle,
  children,
  footer,
}) {
  const panel =
    accent === "teal"
      ? "from-teal-600 via-teal-700 to-slate-900"
      : "from-blue-600 via-blue-700 to-slate-900";

  return (
    <div className="flex min-h-dvh flex-col bg-white lg:flex-row">
      {/* Panel de marca */}
      <aside
        className={`hidden bg-gradient-to-br ${panel} lg:flex lg:w-[44%] lg:flex-col lg:justify-between lg:p-12`}
      >
        <Link
          href="/"
          className="flex w-fit items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <img
            src="/Boxes_logo.png"
            alt="Boxes"
            className="h-10 w-10 rounded-lg object-cover"
          />
          <span className="flex flex-col leading-tight text-white">
            <span className="text-sm font-bold">Boxes</span>
            <span className="text-[11px] text-white/70">
              Everything in one box
            </span>
          </span>
        </Link>

        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
            Toda tu tienda
            <br />
            en una sola caja
          </h2>
          <ul className="mt-7 space-y-3">
            {PUNTOS.map((p) => (
              <li key={p} className="flex gap-3 text-[15px] text-white/85">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" aria-hidden />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/simulacion"
          className="flex w-fit min-h-[44px] items-center gap-2 rounded-lg border border-white/25 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <FlaskConical className="h-4 w-4" aria-hidden />
          Prefiero probarla primero
        </Link>
      </aside>

      {/* Formulario */}
      <main className="flex flex-1 flex-col px-5 py-6 sm:px-8">
        <Link
          href="/"
          className="flex w-fit min-h-[44px] items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver al inicio
        </Link>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">
            {/* El logo solo aparece cuando el panel de marca está escondido:
                con los dos a la vez se vería repetido. */}
            <img
              src="/Boxes_logo.png"
              alt="Boxes"
              className="h-12 w-12 rounded-xl object-cover lg:hidden"
            />

            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 lg:mt-0">
              {title}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
              {subtitle}
            </p>

            <div className="mt-7">{children}</div>

            {footer && (
              <div className="mt-7 border-t border-slate-100 pt-5">{footer}</div>
            )}

            {/* En móvil el panel de marca no está, así que la salida a la
                simulación se repite acá abajo. */}
            <Link
              href="/simulacion"
              className="mt-5 flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
            >
              <FlaskConical className="h-4 w-4 text-teal-600" aria-hidden />
              Prefiero probarla primero
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
