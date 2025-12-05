// SidebarEnhanced.jsx
import PropTypes from "prop-types";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faBox,
  faShoppingCart,
  faClipboardList,
  faChartBar,
  faCog,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const menuItems = [
  { path: "/", label: "Inicio", icon: faHome },
  { path: "/products", label: "Productos", icon: faBox },
  { path: "/sales", label: "Ventas", icon: faShoppingCart },
  { path: "/orders", label: "Pedidos", icon: faClipboardList },
  { path: "/summary", label: "Reportes", icon: faChartBar },
  { path: "/settings", label: "Configuración", icon: faCog },
];

const SidebarEnhanced = ({ isExpanded, onToggle }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-full bg-gray-900 text-white shadow-lg transition-all duration-300 ${
        isExpanded ? "w-64" : "w-16"
      }`}
      aria-label="Barra lateral principal"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-800 px-3 py-3">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo"
            className={`rounded-full object-cover transition-all duration-300 ${isExpanded ? "h-10 w-10" : "h-8 w-8"}`}
          />
          {isExpanded && (
            <span className="text-lg font-semibold">ERP Supermarket</span>
          )}
        </div>

        <button
          onClick={onToggle}
          aria-label={isExpanded ? "Colapsar menú" : "Expandir menú"}
          className="rounded p-1 hover:bg-gray-700/60 focus:outline-none"
        >
          <FontAwesomeIcon icon={isExpanded ? faChevronLeft : faChevronRight} />
        </button>
      </div>

      {/* Menu */}
      <nav className="mt-4" aria-label="Navegación principal">
        <ul className="space-y-1">
          {menuItems.map((it) => {
            const active =
              pathname === it.path ||
              (it.path !== "/" && pathname.startsWith(it.path));
            return (
              <li key={it.path}>
                <button
                  onClick={() => navigate(it.path)}
                  title={!isExpanded ? it.label : undefined} // tooltip when collapsed
                  className={`mx-3 mb-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150 ${active ? "bg-blue-600 text-white" : "text-gray-200 hover:bg-gray-800/80"} ${isExpanded ? "justify-start" : "justify-center"}`}
                  aria-current={active ? "page" : undefined}
                >
                  <FontAwesomeIcon
                    icon={it.icon}
                    className={`h-5 w-5 ${active ? "text-white" : "text-gray-300"}`}
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
      <div className="absolute bottom-4 w-full px-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          {isExpanded ? (
            <>
              <span>v1.0 • ERP</span>
              <span className="hidden md:inline">
                Soporte: soporte@erp.local
              </span>
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
  onToggle: PropTypes.func.isRequired,
};

export default SidebarEnhanced;
