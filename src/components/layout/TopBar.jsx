// TopBar.jsx
"use client";

import { useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faSearch,
  faBell,
  faPlus,
  faUserCircle,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";

const TopBar = ({ onToggleSidebar, isSidebarExpanded, onSearch, onQuickCreate }) => {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [userOpen, setUserOpen] = useState(false);
  const [notifications] = useState(2); // ejemplo estático, conectar con backend si quieres

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(q);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="flex items-center gap-4 px-4 py-3 md:px-6">
        {/* Izquierda: toggle + contexto de página */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label={isSidebarExpanded ? "Colapsar menú" : "Expandir menú"}
            className="shrink-0 rounded-md p-2 text-slate-600 hover:bg-slate-100 focus:outline-none"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          <div className="hidden min-w-0 sm:block">
            <h1 className="truncate text-sm font-semibold text-slate-800">
              Panel
            </h1>
            <p className="truncate text-xs text-slate-400">Productos</p>
          </div>
        </div>

        {/* Centro: búsqueda */}
        <form
          onSubmit={handleSearchSubmit}
          className="mx-auto w-full max-w-md flex-1"
        >
          <label htmlFor="top-search" className="sr-only">
            Buscar
          </label>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-200">
            <FontAwesomeIcon icon={faSearch} className="text-slate-400" />
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

        {/* Derecha: acciones */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() =>
              onQuickCreate ? onQuickCreate() : router.push("/products/new")
            }
            className="hidden items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 sm:flex"
            title="Crear nuevo"
          >
            <FontAwesomeIcon icon={faPlus} /> Nuevo
          </button>

          <button
            onClick={() => alert("Notificaciones (placeholder)")}
            className="relative rounded-md p-2 text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Notificaciones"
          >
            <FontAwesomeIcon icon={faBell} />
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
              <FontAwesomeIcon
                icon={faUserCircle}
                className="h-6 w-6 text-slate-500"
              />
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
                  <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

TopBar.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
  isSidebarExpanded: PropTypes.bool.isRequired,
  onSearch: PropTypes.func,
  onQuickCreate: PropTypes.func,
};

export default TopBar;
