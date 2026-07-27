import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

// Cierre de la página: la última oportunidad de que alguien entre a probarla.
// El manual va como opción secundaria para quien prefiere leer antes de tocar.
export default function FinalCta() {
  return (
    <section className="border-t border-slate-100 bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6 md:py-20">
        <img
          src="/Boxes_logo.png"
          alt=""
          className="mx-auto h-14 w-14 rounded-2xl object-cover shadow-lg"
        />
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Empieza a llevar la tienda en serio
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-slate-300">
          Entra a la simulación y míralo funcionando en menos de un minuto. No
          hay que registrarse ni dar ningún dato.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/simulacion"
            className="group flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white px-7 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Probar la simulación
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          </Link>
          {/* Va a /signup y no a /manual: el manual exige sesión, así que a un
              visitante lo mandaría a la pantalla de login sin explicación. */}
          <Link
            href="/signup"
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/25 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <Store className="h-4 w-4" aria-hidden />
            Crear mi tienda
          </Link>
        </div>
      </div>
    </section>
  );
}
