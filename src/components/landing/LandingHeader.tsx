import Link from "next/link";
import { FlaskConical } from "lucide-react";

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6">
        <img
          src="/Boxes_logo.png"
          alt=""
          className="h-9 w-9 rounded-full object-cover"
        />
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-slate-800">Boxes</span>
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
  );
}
