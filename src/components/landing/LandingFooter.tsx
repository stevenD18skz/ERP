import Link from "next/link";

const LINKS = [
  { href: "/dashboard", label: "Aplicación" },
  { href: "/simulacion", label: "Simulación" },
  { href: "/manual", label: "Manual" },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
        <p>Boxes · Everything in one box — administración para la tienda</p>
        <div className="flex gap-4">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
