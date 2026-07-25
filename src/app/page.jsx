"use client";

import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { productsHome, ordersHome, salesHome } from "@/lib/mockHome";



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






const Hero = ({ topProduct, totalSales, dailyAvg, onSignIn }) => (
  <section className="mx-auto w-full w-full overflow-hidden rounded-2xl shadow-lg">
    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-10">
      <img
        src="https://images.unsplash.com/photo-1542831371-d531d36971e6?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder"
        alt="hero"
        className="absolute inset-0 h-full w-full object-cover opacity-10"
      />
      <div className="relative z-10 grid grid-cols-1 items-center gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="animate-fade-slide-up text-3xl font-extrabold text-white md:text-4xl">
            Control total de tu supermercado
          </h2>
          <p className="mt-2 max-w-xl animate-fade-slide-up text-blue-100 [animation-delay:60ms]">
            Panel minimalista con insights clave: ventas, inventario, órdenes y
            alertas. Diseño limpio, decisiones rápidas.
          </p>
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
  <div className="rounded-lg bg-white p-4 shadow-sm transition-transform duration-200 hover:-translate-y-1">
    <div className="text-sm font-medium text-slate-500">{label}</div>
    <div className="mt-2 flex items-baseline justify-between gap-2">
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      {children}
    </div>
    {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
  </div>
);

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  hint: PropTypes.string.isRequired,
  children: PropTypes.node,
};

const TopProductsHome = ({ items }) => (
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

TopProductsHome.propTypes = {
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
              {s.productsHome.map((p) => p.product).join(", ")}
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
    () => salesHome.reduce((s, x) => s + x.total_amount, 0),
    [],
  );
  const mostSold = useMemo(() => {
    // crude heuristic: product name frequency from ordersHome
    const freq = {};
    ordersHome.forEach((o) =>
      o.productsHome.forEach(
        (p) => (freq[p.product] = (freq[p.product] || 0) + p.quantity),
      ),
    );
    const best = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : "—";
  }, []);
  const highestSale = useMemo(
    () => Math.max(...salesHome.map((s) => s.total_amount)),
    [],
  );
  const dailyAvg = useMemo(
    () => Math.round(totalSales / Math.max(1, 7)),
    [totalSales],
  );
  const salesSeries = salesHome.map((s) => s.total_amount);

  const topProductsHome = productsHome
    .slice()
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

  return (
    <>
      

      <main className="">
        <Hero
          topProduct={mostSold}
          totalSales={totalSales}
          dailyAvg={currency(dailyAvg)}
          onSignIn={() => setShowLogin(true)}
        />

        <section
          id="dashboard"
          className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3"
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
                value={`${productsHome.length}`}
                hint="Total en catálogo"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <RecentSalesTable items={salesHome} />
              </div>
              <div>
                <TopProductsHome items={topProductsHome} />
                <div className="mt-4">
                  <InventoryAlerts items={productsHome} threshold={10} />
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
                  {new Date(ordersHome[0].order_date).toLocaleString()}
                </li>
                <li>
                  Venta registrada —{" "}
                  {new Date(salesHome[1].sale_date).toLocaleString()}
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
                      salesHome.reduce((a, b) => a + b.gain, 0) / salesHome.length || 0,
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


      </main>

      {/* Simple login modal (non-functional placeholder) */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md animate-scale-in rounded-xl bg-white p-6 shadow-lg">
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
          </div>
        </div>
      )}
    </>
  );
}
