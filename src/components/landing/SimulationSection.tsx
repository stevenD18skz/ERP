import Link from "next/link";
import { ArrowRight, Check, FlaskConical, ShieldCheck } from "lucide-react";
import { SIMULACION_PUNTOS } from "./landingData";

export default function SimulationSection() {
  return (
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
              botones— pero con una tienda inventada: 22 productos, unas ventas
              del día, cuatro pedidos y dos semanas de cierres. Sirve para
              aprender a usarla, para mostrarla, o para ensayar algo antes de
              hacerlo de verdad.
            </p>

            <ul className="mt-6 space-y-2.5">
              {SIMULACION_PUNTOS.map((punto) => (
                <li key={punto} className="flex gap-2.5 text-sm text-slate-700">
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
                <ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden />
                Cómo se distingue
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Mientras la simulación está encendida, un aviso amarillo acompaña
                todas las pantallas. Si no está ese aviso, lo que se ve es la
                tienda de verdad.
              </p>

              {/* Muestra del aviso real, para reconocerlo antes de encontrárselo. */}
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
                <p className="text-xs leading-relaxed text-amber-900">
                  <span className="font-semibold">Modo simulación.</span> Datos
                  de prueba: nada de lo que hagas aquí toca la información de la
                  tienda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
