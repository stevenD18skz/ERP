const Footer = () => {
  return (
    <footer className="mt-8 border-t bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-3">
        <div>
          <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-full" />
          <p className="mt-3 text-sm text-slate-600">
            ERP Supermarket — panel ligero para administrar tu tienda. Diseño
            pensado para dueños: claro, directo y rápido.
          </p>
          <div className="mt-3 text-xs text-slate-400">Versión 1.0</div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-800">
            Enlaces rápidos
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <a href="/products" className="hover:underline">
                Productos
              </a>
            </li>
            <li>
              <a href="/sales" className="hover:underline">
                Ventas
              </a>
            </li>
            <li>
              <a href="/orders" className="hover:underline">
                Pedidos
              </a>
            </li>
            <li>
              <a href="/summary" className="hover:underline">
                Reportes
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-800">Soporte</h4>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div>
              Email:{" "}
              <a
                href="mailto:soporte@erp.local"
                className="text-blue-600 hover:underline"
              >
                soporte@erp.local
              </a>
            </div>
            <div>
              Tel:{" "}
              <a
                href="tel:+57123456789"
                className="text-blue-600 hover:underline"
              >
                +57 1 234 567 89
              </a>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Horario: Lun-Vie 9:00 - 18:00
            </div>
          </div>
        </div>
      </div>

      <div className="border-t bg-gray-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} ERP Supermarket</div>
          <div>Hecho con ♥ — Simple & útil</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
