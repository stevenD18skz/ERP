// SidebarEnhanced.jsx
"use client";

import PropTypes from "prop-types";
import { useRouter, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBox,
  faShoppingCart,
  faClipboardList,
  faChartBar,
  faCog,
} from "@fortawesome/free-solid-svg-icons";

const menuItems = [
  { path: "/", label: "Inicio", icon: faHome },
  { path: "/products", label: "Productos", icon: faBox },
  { path: "/sales", label: "Ventas", icon: faShoppingCart },
  { path: "/orders", label: "Pedidos", icon: faClipboardList },
  { path: "/summary", label: "Reportes", icon: faChartBar },
  { path: "/settings", label: "Configuración", icon: faCog },
];

const SidebarEnhanced = ({ isExpanded }) => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-full border-r border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-300 ${
        isExpanded ? "w-64" : "w-16"
      }`}
      aria-label="Barra lateral principal"
    >
      {/* Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-3">
        <img
          src="/logo.png"
          alt="Logo"
          className={`shrink-0 rounded-full object-cover transition-all duration-300 ${isExpanded ? "h-9 w-9" : "h-8 w-8"}`}
        />
        {isExpanded && (
          <span className="truncate text-sm font-semibold text-slate-800">
            ERP Supermarket
          </span>
        )}
      </div>

      {/* Menu */}
      <nav className="mt-3" aria-label="Navegación principal">
        <ul className="space-y-1">
          {menuItems.map((it) => {
            const active =
              pathname === it.path ||
              (it.path !== "/" && pathname.startsWith(it.path));
            return (
              <li key={it.path}>
                <button
                  onClick={() => router.push(it.path)}
                  title={!isExpanded ? it.label : undefined} // tooltip when collapsed
                  className={`mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-md border-l-2 px-3 py-2 text-left transition-colors duration-150 ${
                    active
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  } ${isExpanded ? "justify-start" : "justify-center"}`}
                  aria-current={active ? "page" : undefined}
                >
                  <FontAwesomeIcon
                    icon={it.icon}
                    className={`h-4 w-4 ${active ? "text-blue-600" : "text-slate-400"}`}
                  />
                  {isExpanded && (
                    <span className="text-sm font-medium">{it.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer pequeño en sidebar (version) */}
      <div className="absolute bottom-0 w-full border-t border-slate-100 px-3 py-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          {isExpanded ? (
            <>
              <span>v1.0 • ERP</span>
              <span className="hidden md:inline">soporte@erp.local</span>
            </>
          ) : (
            <span className="mx-auto text-center">v1.0</span>
          )}
        </div>
      </div>
    </aside>
  );
};

SidebarEnhanced.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
};

export default SidebarEnhanced;
