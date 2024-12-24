import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faBox, faShoppingCart, faClipboardList, faChartBar, faCog } from "@fortawesome/free-solid-svg-icons";

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
    <aside className={`fixed h-full ${isExpanded ? "w-64" : "w-16"} bg-gray-900 text-white shadow-lg transition-width duration-300`}>
      {/* Header del menú */}
      <div className="border-b border-gray-700 bg-gray-800 p-4 flex justify-between items-center">
        <h2 className={`text-xl font-bold ${isExpanded ? "block" : "hidden"}`}>Menú</h2>
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
                className="block w-full rounded-lg p-4 text-left transition hover:bg-gray-700 focus:bg-gray-700 focus:outline-none flex items-center"
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
