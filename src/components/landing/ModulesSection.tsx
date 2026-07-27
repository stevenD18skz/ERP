import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { MODULOS } from "./landingData";

export default function ModulesSection() {
  return (
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
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
