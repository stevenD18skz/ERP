import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

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
  { path: "", label: "Inicio", icon: faHome },
  { path: "/products", label: "Productos", icon: faBox },
  { path: "/sales", label: "Ventas", icon: faShoppingCart },
  { path: "/orders", label: "Pedidos", icon: faClipboardList },
  { path: "/summary", label: "Reportes", icon: faChartBar },
  { path: "/settings", label: "Configuración", icon: faCog },
];

const SideBar = ({ isExpanded, onToggle }) => {
  const navigate = useNavigate();

  return (
    <aside
      className={`fixed h-full bg-gray-900 text-white shadow-lg transition-all duration-300 ${
        isExpanded ? "w-64" : "w-16"
      }`}
    >
      {/* Header del menú */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="Imagen del logo"
            className={`rounded-full transition-all duration-300 ${
              isExpanded ? "h-8 w-8" : "h-6 w-6"
            }`}
          />
          {isExpanded && (
            <h2 className="ml-4 text-xl font-bold">ERP Supermarket</h2>
          )}
        </div>
        <button
          onClick={onToggle}
          className="text-gray-300 hover:text-white focus:outline-none"
        >
          <FontAwesomeIcon icon={isExpanded ? faChevronLeft : faChevronRight} />
        </button>
      </div>

      {/* Lista de enlaces */}
      <nav className="mt-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={`mx-4 flex w-10/12 items-center rounded-lg p-3 text-left transition-all duration-300 ${
                  isExpanded ? "justify-start" : "justify-center"
                } hover:bg-gray-700 focus:bg-gray-700 focus:outline-none`}
                aria-label={item.label}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="h-5 w-5 text-gray-300"
                />
                {isExpanded && (
                  <span className="ml-4 text-sm text-gray-200">
                    {item.label}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

SideBar.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default SideBar;
