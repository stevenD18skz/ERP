import React from "react";

const SideBar = () => {
  return (
    <aside className="fixed hidden h-full w-64 bg-gray-900 text-white shadow-lg md:block">
      {/* Header del menú */}
      <div className="border-b border-gray-700 bg-gray-800 p-4">
        <h2 className="text-xl font-bold">Menú</h2>
      </div>

      {/* Lista de enlaces */}
      <nav className="mt-4">
        <ul className="space-y-2">
          <li>
            <a
              href="#home"
              className="block rounded-lg p-4 transition hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
              aria-label="Inicio"
            >
              Inicio
            </a>
          </li>
          <li>
            <a
              href="#products"
              className="block rounded-lg p-4 transition hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
              aria-label="Productos"
            >
              Productos
            </a>
          </li>
          <li>
            <a
              href="#orders"
              className="block rounded-lg p-4 transition hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
              aria-label="Pedidos"
            >
              Pedidos
            </a>
          </li>
          <li>
            <a
              href="#customers"
              className="block rounded-lg p-4 transition hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
              aria-label="Clientes"
            >
              Clientes
            </a>
          </li>
          <li>
            <a
              href="#reports"
              className="block rounded-lg p-4 transition hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
              aria-label="Reportes"
            >
              Reportes
            </a>
          </li>
          <li>
            <a
              href="#settings"
              className="block rounded-lg p-4 transition hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
              aria-label="Configuración"
            >
              Configuración
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default SideBar;
