import Link from "next/link";
import { ArrowRight, Check, FlaskConical, Sparkles } from "lucide-react";
import AppPreview from "./AppPreview";

const GARANTIAS = ["Sin instalar nada", "Sin tarjeta", "Funciona en el celular"];

// Hero de la página pública.
//
// El fondo son dos manchas de color muy difusas sobre una rejilla tenue: da
// profundidad sin cargar una imagen de fondo, y no compite con el texto. Va en
// un contenedor con overflow-hidden y aria-hidden porque es pura decoración.
export default function LandingHero({
  hasSession = false,
}: {
  hasSession?: boolean;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-slate-100 bg-white">
      {/* Decoración */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]" />
        <div className="absolute -left-32 -top-32 h-[26rem] w-[26rem] rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -right-24 top-24 h-[22rem] w-[22rem] rounded-full bg-teal-200/40 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Hecho para tiendas de barrio
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 md:text-6xl">
              Toda tu tienda
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                en una sola caja
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Inventario, punto de venta, pedidos a proveedores, gastos y
              reportes. Lo que hoy vive repartido entre un cuaderno y una hoja de
              cálculo, junto y al día — sin fórmulas que se rompan.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={hasSession ? "/dashboard" : "/login"}
                className="group flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Entra a mi tienda
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden
                />
              </Link>

              <Link
                href="/simulacion"
                className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 text-base font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <FlaskConical className="h-4 w-4 text-teal-600" aria-hidden />
                Probar ahora mismo
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
              {GARANTIAS.map((g) => (
                <li
                  key={g}
                  className="flex items-center gap-1.5 text-sm text-slate-500"
                >
                  <Check
                    className="h-4 w-4 shrink-0 text-teal-600"
                    aria-hidden
                  />
                  {g}
                </li>
              ))}
            </ul>
          </div>

          {/* Vista de la aplicación */}
          <div className="relative">
            <div className="lg:rotate-1 lg:transform">
              <AppPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
