import Link from "next/link";

const LINKS = [
  { href: "/simulacion", label: "Probar la simulación" },
  { href: "/manual", label: "Manual" },
  { href: "/login", label: "Entrar" },
  { href: "/signup", label: "Crear una tienda" },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="flex items-center gap-2">
          <img
            src="/Boxes_logo.png"
            alt=""
            className="h-6 w-6 rounded object-cover"
          />
          Boxes · Everything in one box
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded transition-colors hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
