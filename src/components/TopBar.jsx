// TopBar.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faSearch,
  faBell,
  faPlus,
  faUserCircle,
  faSignOutAlt,
} from "@fortawesome/free-solid-svg-icons";

const TopBar = ({
  onToggleSidebar,
  isSidebarExpanded,
  onSearch,
  onQuickCreate,
}) => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [userOpen, setUserOpen] = useState(false);
  const [notifications] = useState(2); // ejemplo estático, conectar con backend si quieres

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(q);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Alternar menú"
            className="rounded-md p-2 hover:bg-gray-100 focus:outline-none"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-slate-800">
              ERP Supermarket
            </h1>
            <p className="text-xs text-slate-500">Panel / Productos</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4">
          <form onSubmit={handleSearchSubmit} className="w-full max-w-md">
            <label htmlFor="top-search" className="sr-only">
              Buscar
            </label>
            <div className="flex items-center gap-2 rounded-md border bg-white px-2 py-1 shadow-sm">
              <FontAwesomeIcon icon={faSearch} className="text-slate-400" />
              <input
                id="top-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar productos, SKU..."
                className="w-full text-sm outline-none"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="px-2 text-xs text-slate-400"
                >
                  Limpiar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              onQuickCreate ? onQuickCreate() : navigate("/products/new")
            }
            className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm text-white shadow-sm"
            title="Crear nuevo"
          >
            <FontAwesomeIcon icon={faPlus} /> Nuevo
          </button>

          <button
            onClick={() => alert("Notificaciones (placeholder)")}
            className="relative rounded-md p-2 hover:bg-gray-100 focus:outline-none"
            aria-label="Notificaciones"
          >
            <FontAwesomeIcon icon={faBell} />
            {notifications > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
                {notifications}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setUserOpen((s) => !s)}
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 focus:outline-none"
              aria-haspopup="menu"
              aria-expanded={userOpen}
            >
              <FontAwesomeIcon
                icon={faUserCircle}
                className="h-6 w-6 text-slate-600"
              />
              <div className="hidden text-left sm:block">
                <div className="text-xs text-slate-700">Administrador</div>
                <div className="text-[11px] text-slate-400">
                  admin@erp.local
                </div>
              </div>
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-lg">
                <button
                  onClick={() => {
                    setUserOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  Perfil
                </button>
                <button
                  onClick={() => {
                    setUserOpen(false);
                    alert("Cerrar sesión placeholder");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
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
  isSidebarExpanded: PropTypes.bool,
  onSearch: PropTypes.func,
  onQuickCreate: PropTypes.func,
};

export default TopBar;
