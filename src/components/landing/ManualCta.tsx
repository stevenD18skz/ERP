import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export default function ManualCta() {
  return (
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
              Para qué es cada sección y cómo se hace cada tarea, escrito para
              quien atiende la tienda. Está en construcción: por ahora se puede
              ver el índice de lo que va a explicar.
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
  );
}
