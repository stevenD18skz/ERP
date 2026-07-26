// TopBar.jsx
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Bell, CircleUserRound, LogOut } from "lucide-react";
import SupabaseStatusChip from "@/components/ui/SupabaseStatusChip";

const PAGE_TITLES = [
  { path: "/", label: "Inicio" },
  { path: "/products", label: "Productos" },
  { path: "/sales", label: "Ventas" },
  { path: "/orders", label: "Pedidos" },
  { path: "/summary", label: "Reportes" },
  { path: "/settings", label: "Configuración" },
];

const getPageTitle = (pathname) => {
  const exact = PAGE_TITLES.find((p) => p.path === pathname);
  if (exact) return exact.label;
  const prefixMatch = PAGE_TITLES.find(
    (p) => p.path !== "/" && pathname?.startsWith(p.path),
  );
  return prefixMatch ? prefixMatch.label : "";
};

const TopBar = ({ onSearch }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [userOpen, setUserOpen] = useState(false);
  const [notifications] = useState(2); // ejemplo estático, conectar con backend si quieres

  const title = getPageTitle(pathname);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(q);
  };

  return (
    <header className="sticky top-0 z-30  bg-slate-50">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">




        {/* Izquierda: título de la vista actual */}
        <h1 className="  text-lg font-bold text-slate-900 md:text-xl">
          {title}
        </h1>



        {/* Derecha: acciones */}
        <div className="flex  items-center gap-2">

          
          <SupabaseStatusChip />


          {/* Búsqueda */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-xs flex-1"
          >
            <label htmlFor="top-search" className="sr-only">
              Buscar
            </label>
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-200">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                id="top-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar productos, SKU..."
                className="w-full text-sm outline-none placeholder:text-slate-400"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="px-1 text-xs text-slate-400 hover:text-slate-600"
                >
                  Limpiar
                </button>
              )}
            </div>
          </form>



          <button
            onClick={() => alert("Notificaciones (placeholder)")}
            className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            {notifications > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
                {notifications}
              </span>
            )}
          </button>

          <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />

          <div className="relative">
            <button
              onClick={() => setUserOpen((s) => !s)}
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100 focus:outline-none"
              aria-haspopup="menu"
              aria-expanded={userOpen}
            >
              <CircleUserRound className="h-6 w-6 text-slate-500" />
              <div className="hidden text-left sm:block">
                <div className="text-xs font-medium text-slate-700">
                  Administrador
                </div>
                <div className="text-[11px] text-slate-400">
                  admin@erp.local
                </div>
              </div>
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    setUserOpen(false);
                    router.push("/profile");
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  Perfil
                </button>
                <button
                  onClick={() => {
                    setUserOpen(false);
                    alert("Cerrar sesión placeholder");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>



      </div>
    </header>
  );
};

export default TopBar;
