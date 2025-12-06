import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { currency, sparklinePath } from "@/utils/helpers";
import { products, orders, sales } from "@/lib/mock";

// Components 
import Hero from "./components/Hero";
import StatCard from "./components/StatCard";
import RecentSalesTable from "./components/RecentSalesTable";
import TopProducts from "./components/TopProducts";
import InventoryAlerts from "./components/InventoryAlerts";

export default function Home() {
  const [showLogin, setShowLogin] = useState(false);

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
    <div className="min-h-screen "> 

      <main className="">
        <Hero
          topProduct={mostSold}
          totalSales={totalSales}
          dailyAvg={dailyAvg}
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
      </main>

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
