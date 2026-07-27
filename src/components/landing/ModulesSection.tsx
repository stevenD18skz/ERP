import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { MODULOS } from "./landingData";

export default function ModulesSection() {
  return (
    <section
      id="modulos"
      aria-labelledby="modulos-h"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-6 md:py-20"
    >
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-indigo-600">
          Qué trae por dentro
        </span>
        <h2
          id="modulos-h"
          className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl"
        >
          Seis secciones, un trabajo concreto cada una
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          Todas conectadas entre sí: una venta toca el inventario, un pedido
          recibido lo devuelve, y todo termina sumado en los reportes.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {MODULOS.map((modulo) => (
          <article
            key={modulo.titulo}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg motion-reduce:hover:translate-y-0"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${modulo.accent}`}
            >
              <modulo.icon className="h-5 w-5" aria-hidden />
            </span>

            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              {modulo.titulo}
            </h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
              {modulo.proposito}
            </p>

            <ul className="mt-4 flex-1 space-y-2">
              {modulo.puntos.map((punto) => (
                <li key={punto} className="flex gap-2 text-sm text-slate-600">
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
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                aria-hidden
              />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
