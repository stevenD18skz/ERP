import Link from "next/link";
import { FlaskConical } from "lucide-react";

const NAV = [
  { href: "#beneficios", label: "Beneficios" },
  { href: "#modulos", label: "Secciones" },
  { href: "/manual", label: "Manual" },
];

export default function LandingHeader({
  hasSession = false,
}: {
  hasSession?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <img
            src="/Boxes_logo.png"
            alt="Boxes"
            className="h-9 w-9 rounded-lg object-cover"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-slate-900">Boxes</span>
            <span className="hidden text-[11px] text-slate-500 sm:block">
              Everything in one box
            </span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Los enlaces de sección se esconden en móvil: no caben junto a los
              dos botones de acción, y el contenido queda igual al hacer scroll. */}
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="hidden min-h-[40px] items-center rounded-md px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:flex"
            >
              {n.label}
            </Link>
          ))}

          <Link
            href="/simulacion"
            className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <FlaskConical className="h-4 w-4 text-teal-600" aria-hidden />
            Probar
          </Link>
          <Link
            href={hasSession ? "/dashboard" : "/login"}
            className="flex min-h-[40px] items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {hasSession ? "Entra a mi tienda" : "Entrar"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
