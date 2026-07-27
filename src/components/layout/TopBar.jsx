// TopBar.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, CircleUserRound, LogOut, Menu } from "lucide-react";
import SupabaseStatusChip from "@/components/ui/SupabaseStatusChip";
import SimulationChip from "@/components/simulation/SimulationChip";
import { useSession } from "@/hooks/useSession";

const TopBar = ({ sidebarExpanded, onToggleSidebar, onSearch }) => {
  const router = useRouter();
  const { tienda, logout } = useSession();
  const [q, setQ] = useState("");
  const [userOpen, setUserOpen] = useState(false);
  const [notifications] = useState(2); // ejemplo estático, conectar con backend si quieres

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(q);
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white">
      <div className="flex h-full items-center gap-3 px-4 md:px-6">
        {/* Izquierda: colapsar sidebar + marca */}
        <button
          onClick={onToggleSidebar}
          aria-label={sidebarExpanded ? "Colapsar menú" : "Expandir menú"}
          aria-expanded={sidebarExpanded}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          onClick={() => router.push("/dashboard")}
          className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Ir al inicio"
        >
          <img
            src="/Boxes_logo.png"
            alt="Boxes"
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
          <span className="hidden truncate text-sm font-semibold text-slate-800 sm:inline">
            Boxes
          </span>
        </button>

        <div className="flex-1" />

        {/* Derecha: acciones */}
        <div className="flex shrink-0 items-center gap-2">
          <SimulationChip />
          <SupabaseStatusChip />

          {/* Búsqueda */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden w-56 md:block xl:w-72"
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
            className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-haspopup="menu"
              aria-expanded={userOpen}
            >
              <CircleUserRound className="h-6 w-6 text-slate-500" />
              <div className="hidden text-left sm:block">
                <div className="text-xs font-medium text-slate-700">
                  {tienda?.dueno ?? "..."}
                </div>
                <div className="text-[11px] text-slate-400">
                  {tienda?.nombre ?? ""}
                </div>
              </div>
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    setUserOpen(false);
                    logout();
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
