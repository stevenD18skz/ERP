import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { CIFRAS } from "./landingData";

export default function LandingHero() {
  return (
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
          proveedor y en qué se fue la plata del mes. Todo eso vivía repartido
          entre un cuaderno y una hoja de cálculo; acá está junto, al día y sin
          fórmulas que se rompan.
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
          La simulación abre la aplicación completa con datos inventados. No toca
          la información de la tienda.
        </p>

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
  );
}
