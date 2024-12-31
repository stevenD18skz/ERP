import React from "react";
import { useNavigate } from "react-router-dom";
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
      className={`fixed h-full ${isExpanded ? "w-64" : "w-16"} transition-width bg-gray-900 text-white shadow-lg duration-300`}
    >
      {/* Header del menú */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-4">
        <h2
          className={`flex items-center text-xl font-bold ${isExpanded ? "block" : "hidden"}`}
        >
          <img
            src="/logo.png"
            alt="Imagen del logo"
            className="max-w-20 rounded-full"
          />
          ERP Supermarket
        </h2>
        <button onClick={onToggle} className="text-white focus:outline-none">
          {isExpanded ? "<" : ">"}
        </button>
      </div>

      {/* Lista de enlaces */}
      <nav className="mt-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className="block w-full items-center rounded-lg p-4 text-left transition hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
                aria-label={item.label}
              >
                <FontAwesomeIcon icon={item.icon} className="mr-2" />
                {isExpanded && item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default SideBar;
