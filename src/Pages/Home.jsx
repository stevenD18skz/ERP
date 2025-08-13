import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

// Mock data (copied + enhanced from your dataset)
const products = [
  {
    id: "1",
    name: "Arroz",
    price: 2.5,
    stock: 100,
    category: "Granos",
    description: "Arroz blanco de grano largo",
    created_at: "2025-08-01T08:00:00Z",
  },
  {
    id: "2",
    name: "Leche",
    price: 1.8,
    stock: 50,
    category: "Lácteos",
    description: "Leche entera 1L",
    created_at: "2025-08-02T09:00:00Z",
  },
  {
    id: "3",
    name: "Pan",
    price: 0.75,
    stock: 30,
    category: "Panadería",
    description: "Pan blanco",
    created_at: "2025-08-03T10:00:00Z",
  },
  {
    id: "4",
    name: "Huevos",
    price: 3.2,
    stock: 200,
    category: "Lácteos",
    description: "Docena de huevos frescos",
    created_at: "2025-08-01T08:00:00Z",
  },
  {
    id: "5",
    name: "Aceite de Girasol",
    price: 5.5,
    stock: 8,
    category: "Aceites",
    description: "Aceite de girasol 1L",
    created_at: "2025-07-28T11:00:00Z",
  },
  {
    id: "6",
    name: "Azúcar",
    price: 1.2,
    stock: 150,
    category: "Dulces",
    description: "Azúcar refinada 1kg",
    created_at: "2025-07-30T12:00:00Z",
  },
  {
    id: "7",
    name: "Pasta",
    price: 2.0,
    stock: 90,
    category: "Granos",
    description: "Pasta tipo espagueti 500g",
    created_at: "2025-08-04T13:00:00Z",
  },
  {
    id: "8",
    name: "Manzanas",
    price: 0.8,
    stock: 6,
    category: "Frutas",
    description: "Manzanas rojas frescas",
    created_at: "2025-08-05T14:00:00Z",
  },
  {
    id: "9",
    name: "Frijoles",
    price: 2.8,
    stock: 120,
    category: "Granos",
    description: "Frijoles negros 1kg",
    created_at: "2025-08-06T15:00:00Z",
  },
  {
    id: "10",
    name: "Yogur",
    price: 1.5,
    stock: 40,
    category: "Lácteos",
    description: "Yogur natural 500ml",
    created_at: "2025-08-02T16:00:00Z",
  },
  {
    id: "11",
    name: "Bananas",
    price: 0.6,
    stock: 70,
    category: "Frutas",
    description: "Bananas maduras",
    created_at: "2025-08-07T17:00:00Z",
  },
];

const orders = [
  {
    products: [
      { product: "Arroz Blanco 1Kg", quantity: 100, price: 2500 },
      { product: "Azúcar Morena 1Kg", quantity: 50, price: 3000 },
    ],
    total_amount: 100 * 2500 + 50 * 3000,
    order_date: "2025-08-10T09:30:00Z",
  },
  {
    products: [
      { product: "Leche Entera 1L", quantity: 80, price: 1800 },
      { product: "Pan Integral", quantity: 40, price: 1200 },
      { product: "Mantequilla 250g", quantity: 30, price: 4000 },
    ],
    total_amount: 80 * 1800 + 40 * 1200 + 30 * 4000,
    order_date: "2025-08-11T14:00:00Z",
  },
  {
    products: [
      { product: "Aceite de Girasol 900ml", quantity: 25, price: 4500 },
      { product: "Café Molido 500g", quantity: 15, price: 7500 },
    ],
    total_amount: 25 * 4500 + 15 * 7500,
    order_date: "2025-08-12T08:45:00Z",
  },
];

const sales = [
  {
    total_amount: 150000,
    sale_date: "2025-08-10T10:30:00Z",
    gain: 50000,
    products: [
      { product: "Camiseta", quantity: 2, sale_price: 30000 },
      { product: "Pantalón", quantity: 1, sale_price: 70000 },
    ],
  },
  {
    total_amount: 260000,
    sale_date: "2025-08-11T15:45:00Z",
    gain: 90000,
    products: [
      { product: "Zapatos", quantity: 2, sale_price: 120000 },
      { product: "Bufanda", quantity: 1, sale_price: 18000 },
    ],
  },
  {
    total_amount: 95000,
    sale_date: "2025-08-12T09:15:00Z",
    gain: 35000,
    products: [{ product: "Bolso", quantity: 1, sale_price: 95000 }],
  },
];

// Helpers
const currency = (n) => {
  if (typeof n !== "number") return "-";
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });
};

function sparklinePath(values, width = 120, height = 36) {
  if (!values || values.length === 0) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const len = values.length;
  const vRange = max - min || 1;
  const step = width / Math.max(1, len - 1);
  const points = values.map((v, i) => {
    const x = Math.round(i * step);
    const y = Math.round(((max - v) / vRange) * (height - 4)) + 2; // padding
    return `${x},${y}`;
  });
  return `M${points.join(" L")}`;
}

// Small, clean components
const HeaderHome = ({ onSignIn }) => (
  <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 md:px-0">
    <div className="flex items-center gap-3">
      <img src="/vite.svg" alt="logo" className="h-10 w-10" />
      <div>
        <h1 className="text-xl font-bold text-slate-800">ERP Supermercado</h1>
        <p className="hidden text-xs text-slate-500 md:block">
          Visión rápida y control de tu tienda
        </p>
      </div>
    </div>
    <nav className="flex items-center gap-3">
      <button
        onClick={onSignIn}
        className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm hover:shadow focus:outline-none"
      >
        Iniciar sesión
      </button>
      <a
        href="#dashboard"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
      >
        Ver Dashboard
      </a>
    </nav>
  </header>
);

HeaderHome.propTypes = {
  onSignIn: PropTypes.func.isRequired,
};

const Hero = ({ topProduct, totalSales, dailyAvg, onSignIn }) => (
  <section className="mx-auto mt-6 w-full max-w-6xl overflow-hidden rounded-2xl shadow-lg">
    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-10">
      <img
        src="https://images.unsplash.com/photo-1542831371-d531d36971e6?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder"
        alt="hero"
        className="absolute inset-0 h-full w-full object-cover opacity-10"
      />
      <div className="relative z-10 grid grid-cols-1 items-center gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <motion.h2
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="text-3xl font-extrabold text-white md:text-4xl"
          >
            Control total de tu supermercado
          </motion.h2>
          <motion.p
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.06, duration: 0.45 }}
            className="mt-2 max-w-xl text-blue-100"
          >
            Panel minimalista con insights clave: ventas, inventario, órdenes y
            alertas. Diseño limpio, decisiones rápidas.
          </motion.p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={onSignIn}
              className="rounded-md bg-white px-5 py-2 text-sm font-semibold text-blue-700 shadow transition-transform hover:translate-y-[-1px]"
            >
              Comenzar — Iniciar sesión
            </button>
            <a
              href="#features"
              className="rounded-md border border-white/30 px-4 py-2 text-sm text-white/90"
            >
              Ver características
            </a>
          </div>
        </div>

        <div className="hidden rounded-xl bg-white/10 p-4 md:block md:p-6">
          <div className="text-sm text-white/80">Producto top</div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-white">{topProduct}</div>
              <div className="mt-1 text-xs text-white/80">
                Promedio ventas diarias: {dailyAvg}
              </div>
            </div>
            <div className="ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 2v20M2 12h20"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="mt-3 text-xs text-white/70">
            Ventas totales:{" "}
            <span className="font-semibold">{currency(totalSales)}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);
Hero.propTypes = {
  topProduct: PropTypes.string.isRequired,
  totalSales: PropTypes.number.isRequired,
  dailyAvg: PropTypes.number.isRequired,
  onSignIn: PropTypes.func.isRequired,
};

const StatCard = ({ label, value, hint, children }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="rounded-lg bg-white p-4 shadow-sm"
  >
    <div className="text-sm font-medium text-slate-500">{label}</div>
    <div className="mt-2 flex items-baseline justify-between gap-2">
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      {children}
    </div>
    {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
  </motion.div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  hint: PropTypes.string.isRequired,
  children: PropTypes.node,
};

const TopProducts = ({ items }) => (
  <div className="rounded-lg bg-white p-4 shadow-sm">
    <h3 className="text-sm font-semibold text-slate-700">Top productos</h3>
    <ul className="mt-3 space-y-3">
      {items.map((p) => (
        <li key={p.id} className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-800">{p.name}</div>
            <div className="text-xs text-slate-400">
              {p.category} • stock {p.stock}
            </div>
          </div>
          <div className="text-sm font-semibold text-slate-700">
            {currency(p.price)}
          </div>
        </li>
      ))}
    </ul>
  </div>
);

TopProducts.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const RecentSalesTable = ({ items }) => (
  <div className="overflow-auto rounded-lg bg-white p-4 shadow-sm">
    <h3 className="text-sm font-semibold text-slate-700">Ventas recientes</h3>
    <table className="mt-3 w-full text-left text-sm">
      <thead>
        <tr className="text-slate-400">
          <th className="pb-2">Fecha</th>
          <th className="pb-2">Total</th>
          <th className="pb-2">Ganancia</th>
          <th className="pb-2">Productos</th>
        </tr>
      </thead>
      <tbody>
        {items.map((s, i) => (
          <tr key={i} className="border-t border-slate-100">
            <td className="py-3 text-slate-600">
              {new Date(s.sale_date).toLocaleString()}
            </td>
            <td className="py-3 font-semibold">{currency(s.total_amount)}</td>
            <td className="py-3 text-slate-600">{currency(s.gain)}</td>
            <td className="py-3 text-slate-600">
              {s.products.map((p) => p.product).join(", ")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

RecentSalesTable.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const InventoryAlerts = ({ items, threshold = 10 }) => {
  const low = items.filter((p) => p.stock <= threshold);
  if (low.length === 0) return null;
  return (
    <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
      <h4 className="text-sm font-semibold text-yellow-800">
        Alertas de inventario
      </h4>
      <ul className="mt-2 text-sm text-yellow-700">
        {low.map((p) => (
          <li key={p.id}>
            • {p.name} — stock: {p.stock}
          </li>
        ))}
      </ul>
    </div>
  );
};

InventoryAlerts.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  threshold: PropTypes.number,
};

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);

  // Derived stats
  const totalSales = useMemo(
    () => sales.reduce((s, x) => s + x.total_amount, 0),
    [],
  );
  const mostSold = useMemo(() => {
    // crude heuristic: product name frequency from orders
    const freq = {};
    orders.forEach((o) =>
      o.products.forEach(
        (p) => (freq[p.product] = (freq[p.product] || 0) + p.quantity),
      ),
    );
    const best = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : "—";
  }, []);
  const highestSale = useMemo(
    () => Math.max(...sales.map((s) => s.total_amount)),
    [],
  );
  const dailyAvg = useMemo(
    () => Math.round(totalSales / Math.max(1, 7)),
    [totalSales],
  );
  const salesSeries = sales.map((s) => s.total_amount);

  const topProducts = products
    .slice()
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <HeaderHome onSignIn={() => setShowLogin(true)} />

      <main className="px-4 md:px-8">
        <Hero
          topProduct={mostSold}
          totalSales={totalSales}
          dailyAvg={currency(dailyAvg)}
          onSignIn={() => setShowLogin(true)}
        />

        <section
          id="dashboard"
          className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3"
        >
          <div className="grid grid-cols-1 gap-6 md:col-span-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <StatCard
                label="Venta mayor"
                value={currency(highestSale)}
                hint="Última semana"
              >
                <div className="text-xs text-slate-400">
                  Cliente: customer XYZ
                </div>
              </StatCard>
              <StatCard
                label="Ventas totales"
                value={currency(totalSales)}
                hint="Suma de ventas recientes"
              >
                <svg
                  width="120"
                  height="36"
                  viewBox="0 0 120 36"
                  className="ml-2"
                >
                  <path
                    d={sparklinePath(salesSeries)}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </StatCard>
              <StatCard
                label="Promedio diario"
                value={currency(dailyAvg)}
                hint="Estimado"
              >
                <div className="text-xs text-slate-400">Basado en 7 días</div>
              </StatCard>
              <StatCard
                label="Productos"
                value={`${products.length}`}
                hint="Total en catálogo"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <RecentSalesTable items={sales} />
              </div>
              <div>
                <TopProducts items={topProducts} />
                <div className="mt-4">
                  <InventoryAlerts items={products} threshold={10} />
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">
                Actividades recientes
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  Orden creada —{" "}
                  {new Date(orders[0].order_date).toLocaleString()}
                </li>
                <li>
                  Venta registrada —{" "}
                  {new Date(sales[1].sale_date).toLocaleString()}
                </li>
                <li>Producto bajo stock — Aceite de Girasol</li>
              </ul>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">
                Insights rápidos
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  Margen promedio (ej.) —{" "}
                  {currency(
                    Math.round(
                      sales.reduce((a, b) => a + b.gain, 0) / sales.length || 0,
                    ),
                  )}
                </li>
                <li>Días de stock (prom.) — 18 días (estimado)</li>
                <li>Productos con rotación alta — Leche, Pan</li>
              </ul>
            </div>

            <div className="rounded-lg bg-white p-4 text-sm shadow-sm">
              <h3 className="font-semibold text-slate-700">Acciones</h3>
              <div className="mt-3 flex flex-col gap-2">
                <button className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                  Registrar venta
                </button>
                <button className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                  Crear orden
                </button>
                <button className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white">
                  Exportar reporte
                </button>
              </div>
            </div>
          </aside>
        </section>

        <section id="features" className="mx-auto mt-10 max-w-6xl">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">
              Por qué este panel
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Diseñado para dueños y encargados: entradas claras, decisiones
              rápidas. Animaciones sutiles, foco en la legibilidad y jerarquía
              visual.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              <li className="rounded-md border p-3 text-sm">
                Alertas automáticas de stock
              </li>
              <li className="rounded-md border p-3 text-sm">
                Exportación CSV / PDF
              </li>
              <li className="rounded-md border p-3 text-sm">
                Roles y permisos (admin, cajero)
              </li>
              <li className="rounded-md border p-3 text-sm">
                Integración POS y facturación
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="mt-10 text-center text-xs text-slate-400">
        Desarrollado por tu equipo ERP • Diseño claro y rápido
      </footer>

      {/* Simple login modal (non-functional placeholder) */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Iniciar sesión</h4>
              <button
                onClick={() => setShowLogin(false)}
                aria-label="Cerrar modal"
                className="text-slate-400"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Cuenta demo: admin@erp / contraseña: demo
            </p>
            <form className="mt-4 space-y-3">
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Correo"
                defaultValue="admin@erp"
              />
              <input
                className="w-full rounded-md border px-3 py-2"
                placeholder="Contraseña"
                defaultValue="demo"
              />
              <div className="flex items-center justify-between">
                <button className="rounded-md bg-blue-600 px-4 py-2 text-white">
                  Entrar
                </button>
                <a href="#" className="text-sm text-blue-600">
                  Olvidé mi contraseña
                </a>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
