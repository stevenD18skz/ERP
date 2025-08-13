// ReportsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import "tailwindcss/tailwind.css";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";


import {
  BarChart2,
  PieChart,
  TrendingUp,
  DollarSign,
  Rows4,
  Box,
  Activity,
  Clock,
  Database,
  Loader2,
  Zap,
} from "lucide-react";

/* register ChartJS components */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  ChartTooltip,
  Legend
);

/*
  ReportsPage.jsx
  - Input services prop: { getSales, getProducts, getOrders } (async)
  - If not provided tries window.getSales etc. (demo fallback)
  - UI/UX consistent with previous pages: cards, clear microcopy, icons
  - Notes: some calculations assume products array contains { id, name, price, stock, category }
*/

export default function ReportsPage({
  services = {
    getSales: window.getSales,
    getProducts: window.getProducts,
    getOrders: window.getOrders,
  },
}) {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [sRes, pRes, oRes] = await Promise.all([
          services.getSales ? services.getSales() : [],
          services.getProducts ? services.getProducts() : [],
          services.getOrders ? services.getOrders() : [],
        ]);
        if (!mounted) return;
        setSales(Array.isArray(sRes) ? sRes : []);
        setProducts(Array.isArray(pRes) ? pRes : []);
        setOrders(Array.isArray(oRes) ? oRes : []);
      } catch (err) {
        console.error("Error cargando datos:", err);
        Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar algunos datos." });
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [services]);

  // Helpers
  const currency = (n) =>
    typeof n === "number"
      ? n.toLocaleString("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })
      : "-";

  // Map product name/id to product object quickly
  const productById = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (p.id != null) map.set(String(p.id), p);
      if (p.name) map.set(String(p.name).toLowerCase(), p);
    });
    return map;
  }, [products]);

  // 1) Sales by category
  const salesByCategory = useMemo(() => {
    // For each sale, for each sold product entry attempt to map to product and take its category.
    // sale.products expected: [{ product_id?, product?, quantity, sale_price }]
    const map = {};
    sales.forEach((sale) => {
      (sale.products || []).forEach((it) => {
        // try id then name
        let cat = "Sin categoría";
        if (it.product_id != null && productById.has(String(it.product_id))) {
          cat = productById.get(String(it.product_id)).category || cat;
        } else if (it.product && productById.has(String(it.product).toLowerCase())) {
          cat = productById.get(String(it.product).toLowerCase()).category || cat;
        }
        // contribution approximated by sale_price * quantity
        const revenue = (Number(it.sale_price) || 0) * (Number(it.quantity) || 0);
        map[cat] = (map[cat] || 0) + revenue;
      });
    });
    // return array sorted desc
    return Object.entries(map)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }, [sales, productById]);

  // 2) Inventory turnover ratio (COGS / Avg inventory value)
  const inventoryMetrics = useMemo(() => {
    // COGS approximate = sum(sale.total_amount - sale.gain)
    const cogs = sales.reduce((acc, s) => acc + (Number(s.total_amount || 0) - Number(s.gain || 0)), 0);
    // inventory value = sum(product.stock * product.price)
    const inventoryValue = products.reduce((acc, p) => acc + (Number(p.stock || 0) * Number(p.price || 0)), 0);
    const ratio = inventoryValue > 0 ? cogs / inventoryValue : null;
    return { cogs, inventoryValue, ratio };
  }, [sales, products]);

  // 3) ATV (average transaction value)
  const atv = useMemo(() => {
    const total = sales.reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
    const count = sales.length || 1;
    return total / count;
  }, [sales]);

  // 4) Slow-moving products (bottom 5 by sold quantity)
  const slowMoving = useMemo(() => {
    const sold = {};
    sales.forEach((s) => {
      (s.products || []).forEach((p) => {
        const key = p.product_id != null ? String(p.product_id) : (p.product || "").toLowerCase();
        const name = p.product || (productById.get(key) && productById.get(key).name) || "Desconocido";
        sold[key] = sold[key] || { id: key, name, qty: 0 };
        sold[key].qty += Number(p.quantity || 0);
      });
    });
    // include products with zero sales
    products.forEach((pr) => {
      const key = pr.id != null ? String(pr.id) : (pr.name || "").toLowerCase();
      if (!sold[key]) sold[key] = { id: key, name: pr.name, qty: 0, stock: pr.stock || 0 };
    });
    const arr = Object.values(sold).map((x) => ({ ...x, stock: (productById.get(String(x.id)) || {}).stock || x.stock || 0 }));
    return arr.sort((a, b) => a.qty - b.qty).slice(0, 8); // bottom 8
  }, [sales, products, productById]);

  // 5) Order fulfillment rate (completed vs total)
  const orderFulfillment = useMemo(() => {
    if (!orders.length) return { completed: 0, pending: 0, rate: 0 };
    // we assume orders may have status: 'completed' | 'pending' or boolean completed
    const completed = orders.filter((o) => o.status === "completed" || o.completed === true).length;
    const pending = orders.length - completed;
    const rate = orders.length ? (completed / orders.length) * 100 : 0;
    return { completed, pending, rate: Number(rate.toFixed(2)) };
  }, [orders]);

  // 6) Sales Growth Rate: compare last 7 days vs previous 7 days
  const salesGrowth = useMemo(() => {
    if (!sales.length) return { rate: 0, current: 0, previous: 0 };
    const now = new Date();
    const endCurrent = new Date(now);
    const startCurrent = new Date(now);
    startCurrent.setDate(startCurrent.getDate() - 7);
    const startPrev = new Date(startCurrent);
    startPrev.setDate(startPrev.getDate() - 7);
    const endPrev = new Date(startCurrent);
    // helper
    const sumBetween = (start, end) =>
      sales.reduce((acc, s) => {
        const d = new Date(s.sale_date || s.order_date || Date.now());
        if (d >= start && d < end) return acc + Number(s.total_amount || 0);
        return acc;
      }, 0);
    const currentSum = sumBetween(startCurrent, endCurrent);
    const prevSum = sumBetween(startPrev, endPrev);
    const rate = prevSum > 0 ? ((currentSum - prevSum) / prevSum) * 100 : currentSum > 0 ? 100 : 0;
    return { rate: Number(rate.toFixed(2)), current: currentSum, previous: prevSum };
  }, [sales]);

  // 7) Margin by category / product (gain/total_amount)
  const marginByCategory = useMemo(() => {
    const map = {};
    sales.forEach((s) => {
      (s.products || []).forEach((it) => {
        // find category
        let cat = "Sin categoría";
        if (it.product_id != null && productById.has(String(it.product_id))) cat = productById.get(String(it.product_id)).category || cat;
        else if (it.product && productById.has(String(it.product).toLowerCase())) cat = productById.get(String(it.product).toLowerCase()).category || cat;
        // distribute gain proportionally by revenue of product within sale
        const revenue = (Number(it.sale_price) || 0) * (Number(it.quantity) || 0);
        const saleGain = Number(s.gain || 0);
        const saleRevenue = Number(s.total_amount || 0);
        const allocatedGain = saleRevenue > 0 ? (revenue / saleRevenue) * saleGain : 0;
        map[cat] = map[cat] || { gain: 0, revenue: 0 };
        map[cat].gain += allocatedGain;
        map[cat].revenue += revenue;
      });
    });
    return Object.entries(map).map(([category, v]) => ({
      category,
      marginPct: v.revenue > 0 ? (v.gain / v.revenue) * 100 : 0,
      gain: v.gain,
      revenue: v.revenue,
    })).sort((a, b) => b.marginPct - a.marginPct);
  }, [sales, productById]);

  const marginByProduct = useMemo(() => {
    const map = {};
    sales.forEach((s) => {
      (s.products || []).forEach((it) => {
        const key = it.product_id != null ? String(it.product_id) : (it.product || "").toLowerCase();
        const name = it.product || (productById.get(String(it.product_id)) || {}).name || "Desconocido";
        const revenue = (Number(it.sale_price) || 0) * (Number(it.quantity) || 0);
        const saleGain = Number(s.gain || 0);
        const saleRevenue = Number(s.total_amount || 0);
        const allocatedGain = saleRevenue > 0 ? (revenue / saleRevenue) * saleGain : 0;
        map[key] = map[key] || { id: key, name, gain: 0, revenue: 0 };
        map[key].gain += allocatedGain;
        map[key].revenue += revenue;
      });
    });
    return Object.values(map).map((p) => ({ ...p, marginPct: p.revenue > 0 ? (p.gain / p.revenue) * 100 : 0 })).sort((a, b) => b.gain - a.gain);
  }, [sales, productById]);

  // 8) Stock by category and days of stock remaining (stock / avg daily sales)
  const stockByCategory = useMemo(() => {
    // sum stock per category
    const stockMap = {};
    products.forEach((p) => {
      const cat = p.category || "Sin categoría";
      stockMap[cat] = stockMap[cat] || { stock: 0, value: 0 };
      stockMap[cat].stock += Number(p.stock || 0);
      stockMap[cat].value += Number(p.stock || 0) * Number(p.price || 0);
    });
    // compute avg daily sales per category (last 30 days)
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const start = now - 30 * dayMs;
    const dailySalesByCategory = {};
    sales.forEach((s) => {
      const d = new Date(s.sale_date || s.order_date || Date.now()).getTime();
      if (d < start) return; // only last 30 days
      (s.products || []).forEach((it) => {
        let cat = "Sin categoría";
        if (it.product_id != null && productById.has(String(it.product_id))) cat = productById.get(String(it.product_id)).category || cat;
        else if (it.product && productById.has(String(it.product).toLowerCase())) cat = productById.get(String(it.product).toLowerCase()).category || cat;
        dailySalesByCategory[cat] = dailySalesByCategory[cat] || 0;
        dailySalesByCategory[cat] += Number(it.quantity || 0);
      });
    });
    // avg per day = sum / 30
    const res = Object.entries(stockMap).map(([category, v]) => {
      const avgDaily = (dailySalesByCategory[category] || 0) / 30;
      const daysLeft = avgDaily > 0 ? v.stock / avgDaily : Infinity;
      return { category, stock: v.stock, value: v.value, avgDaily: Number(avgDaily.toFixed(2)), daysLeft: Number(isFinite(daysLeft) ? daysLeft.toFixed(1) : -1) };
    }).sort((a,b)=>b.stock - a.stock);
    return res;
  }, [products, sales, productById]);

  // 9) Purchases vs Sales timeline (weekly totals last 12 weeks)
  const purchasesVsSalesSeries = useMemo(() => {
    // generate 12 weekly buckets ending today
    const buckets = [];
    const today = new Date();
    // start Monday of 12 weeks ago
    const msWeek = 7 * 24 * 60 * 60 * 1000;
    for (let i = 11; i >= 0; i--) {
      const end = new Date(today.getTime() - i * msWeek);
      const label = `${end.toLocaleDateString()}`;
      buckets.push({ label, start: end.getTime() - msWeek, end: end.getTime(), sales: 0, purchases: 0 });
    }
    // sum sales
    sales.forEach((s) => {
      const t = new Date(s.sale_date || Date.now()).getTime();
      const b = buckets.find((bk) => t >= bk.start && t < bk.end);
      if (b) b.sales += Number(s.total_amount || 0);
    });
    orders.forEach((o) => {
      const t = new Date(o.order_date || Date.now()).getTime();
      const b = buckets.find((bk) => t >= bk.start && t < bk.end);
      if (b) b.purchases += Number(o.total_amount || 0);
    });
    return buckets;
  }, [sales, orders]);

  // 10) Sales forecast - simple moving average of last 14 days, project next 7 days
  const salesForecast = useMemo(() => {
    // aggregate daily totals
    const dayMap = {};
    sales.forEach((s) => {
      const d = new Date(s.sale_date || Date.now());
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = (dayMap[key] || 0) + Number(s.total_amount || 0);
    });
    const days = Object.keys(dayMap).sort();
    // moving average window 7
    const windowSize = 7;
    const series = days.map((day, idx) => {
      const windowDays = days.slice(Math.max(0, idx - windowSize + 1), idx + 1);
      const avg = windowDays.reduce((acc, w) => acc + dayMap[w], 0) / windowDays.length;
      return { day, value: dayMap[day], ma: avg };
    });
    // project next 7 days using last MA
    const lastMA = series.length ? series[series.length - 1].ma : 0;
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      forecast.push({ day: d.toISOString().slice(0, 10), forecast: lastMA });
    }
    return { series, forecast };
  }, [sales]);

  // 11) Top 5 most profitable products (by gain)
  const topProfitProducts = useMemo(() => {
    return marginByProduct.slice(0, 5);
  }, [marginByProduct]);

  // Chart datasets
  const salesByCategoryBar = useMemo(() => {
    const labels = salesByCategory.map((s) => s.category);
    const data = salesByCategory.map((s) => s.value);
    return {
      labels,
      datasets: [
        {
          label: "Ventas (COP)",
          data,
          backgroundColor: "rgba(59,130,246,0.7)",
        },
      ],
    };
  }, [salesByCategory]);

  const purchasesSalesLine = useMemo(() => {
    const labels = purchasesVsSalesSeries.map((b) => b.label);
    const salesData = purchasesVsSalesSeries.map((b) => b.sales);
    const purchasesData = purchasesVsSalesSeries.map((b) => b.purchases);
    return {
      labels,
      datasets: [
        { label: "Ventas", data: salesData, borderColor: "#0ea5e9", tension: 0.3, fill: false },
        { label: "Compras", data: purchasesData, borderColor: "#7c3aed", tension: 0.3, fill: false },
      ],
    };
  }, [purchasesVsSalesSeries]);

  const atvSeries = useMemo(() => {
    // group by day for last 14 days
    const map = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { total: 0, count: 0 };
    }
    sales.forEach((s) => {
      const key = new Date(s.sale_date || Date.now()).toISOString().slice(0, 10);
      if (map[key]) { map[key].total += Number(s.total_amount || 0); map[key].count += 1; }
    });
    const labels = Object.keys(map);
    const values = labels.map((k) => (map[k].count ? map[k].total / map[k].count : 0));
    return { labels, values };
  }, [sales]);

  // small utility to show "n/a" properly
  const safePct = (v) => (v == null || Number.isNaN(v) ? "N/A" : `${(Number(v) * 100).toFixed(1)}%`);

  // Render
  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Reportes y métricas</h1>
            <p className="text-sm text-slate-500 mt-1">Panel de análisis — decisiones claras para la tienda</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { Swal.fire({ title: "Exportar", text: "Exportar este dashboard (PDF/CSV) en próximas iteraciones.", icon: "info" }); }} className="rounded-md border px-3 py-2 text-sm flex items-center gap-2"><DownloadIcon /> Exportar</button>
            <button onClick={() => { Swal.fire({ title: "Ayuda rápida", html: "Lee: 1) Ventas por categoría para priorizar estantes. 2) Rotación para no inmovilizar capital.", icon: "info" }); }} className="rounded-md bg-blue-600 px-3 py-2 text-white text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Ayuda</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <motion.div className="rounded-lg bg-white p-4 shadow-sm flex items-center gap-4">
            <div className="rounded-md bg-blue-50 p-2 text-blue-600"><DollarSign className="h-6 w-6" /></div>
            <div>
              <div className="text-xs text-slate-500">Ingresos totales</div>
              <div className="text-xl font-bold text-slate-800">{currency(sales.reduce((a,s)=>a+Number(s.total_amount||0),0))}</div>
            </div>
          </motion.div>

          <motion.div className="rounded-lg bg-white p-4 shadow-sm flex items-center gap-4">
            <div className="rounded-md bg-red-50 p-2 text-rose-600"><Rows4 className="h-6 w-6" /></div>
            <div>
              <div className="text-xs text-slate-500">Costos (COGS)</div>
              <div className="text-xl font-bold text-slate-800">{currency(inventoryMetrics.cogs)}</div>
            </div>
          </motion.div>

          <motion.div className="rounded-lg bg-white p-4 shadow-sm flex items-center gap-4">
            <div className="rounded-md bg-green-50 p-2 text-emerald-600"><Zap className="h-6 w-6" /></div>
            <div>
              <div className="text-xs text-slate-500">Ganancia bruta</div>
              <div className="text-xl font-bold text-slate-800">{currency(sales.reduce((a,s)=>a+Number(s.gain||0),0))}</div>
            </div>
          </motion.div>

          <motion.div className="rounded-lg bg-white p-4 shadow-sm flex items-center gap-4">
            <div className="rounded-md bg-indigo-50 p-2 text-indigo-600"><Activity className="h-6 w-6" /></div>
            <div>
              <div className="text-xs text-slate-500">ATV (valor medio)</div>
              <div className="text-xl font-bold text-slate-800">{currency(atv)}</div>
            </div>
          </motion.div>

          <motion.div className="rounded-lg bg-white p-4 shadow-sm flex items-center gap-4">
            <div className="w-20">
              <CircularProgressbar value={inventoryMetrics.ratio ? Math.min(inventoryMetrics.ratio * 10, 100) : 0} text={inventoryMetrics.ratio ? inventoryMetrics.ratio.toFixed(2) : "N/A"} styles={{ path: { stroke: "#6366F1" }, text: { fill: "#6366F1", fontSize: "14px" } }} />
            </div>
            <div>
              <div className="text-xs text-slate-500">Rotación inventario (ratio)</div>
              <div className="text-xl font-bold text-slate-800">{inventoryMetrics.ratio ? inventoryMetrics.ratio.toFixed(2) : "N/A"}</div>
            </div>
          </motion.div>
        </div>

        {/* Row: Sales by Category (bar) + Order Fulfillment donut */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-blue-50 p-2 text-blue-600"><BarChart2 className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Ventas por categoría</h3>
                  <div className="text-xs text-slate-500">¿Qué categorías generan más ingresos?</div>
                </div>
              </div>
              <div className="text-sm text-slate-500">Último período</div>
            </div>

            {salesByCategory.length ? (
              <Bar data={salesByCategoryBar} options={{ indexAxis: "y", responsive: true, plugins: { legend: { display: false } } }} />
            ) : (
              <div className="text-center py-12 text-slate-500">No hay datos para mostrar</div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-indigo-50 p-2 text-indigo-600"><PieChart className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Tasa cumplimiento de pedidos</h3>
                  <div className="text-xs text-slate-500">Completados vs. pendientes</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div style={{ width: 180, height: 180 }}>
                <Doughnut data={{
                  labels: ["Completados", "Pendientes"],
                  datasets: [{ data: [orderFulfillment.completed, orderFulfillment.pending], backgroundColor: ["#10B981", "#F97316"] }],
                }} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
              </div>
            </div>

            <div className="mt-4 text-center">
              <div className="text-sm text-slate-500">Tasa: <span className="font-semibold text-slate-800">{orderFulfillment.rate}%</span></div>
              <div className="text-xs text-slate-400 mt-1">Completados: {orderFulfillment.completed} • Pendientes: {orderFulfillment.pending}</div>
            </div>
          </div>
        </div>

        {/* Row: ATV trend + Purchases vs Sales dual-line */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="text-md font-semibold text-slate-800 mb-2">Valor promedio por transacción (ATV)</h4>
            <Line data={{ labels: atvSeries.labels, datasets: [{ label: "ATV", data: atvSeries.values, borderColor: "#06B6D4", backgroundColor: "rgba(6,182,212,0.1)", fill: true }] }} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            <div className="mt-3 text-xs text-slate-500">Promedio global: <span className="font-medium text-slate-800">{currency(atv)}</span></div>
          </div>

          <div className="lg:col-span-2 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold text-slate-800">Compras vs Ventas (últimas 12 semanas)</div>
              <div className="text-xs text-slate-500">Suma semanal</div>
            </div>
            <Line data={purchasesSalesLine} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
          </div>
        </div>

        {/* Row: slow-moving + margins + stock by category */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Productos de baja rotación</h4>
            {slowMoving.length ? (
              <ul className="space-y-3">
                {slowMoving.map((p, i) => (
                  <li key={p.id} className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-500">Vendidos: {p.qty} • Stock: {p.stock ?? "—"}</div>
                    </div>
                    <div className="w-40">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div style={{ width: `${Math.min(100, (p.qty/10)*100)}%` }} className="h-2 bg-rose-400" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <div className="text-slate-500">No hay datos</div>}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Margen por categoría</h4>
            {marginByCategory.length ? (
              <div className="space-y-3">
                {marginByCategory.slice(0,6).map((m) => (
                  <div key={m.category} className="flex items-center justify-between">
                    <div className="text-sm text-slate-800">{m.category}</div>
                    <div className="text-sm font-semibold" style={{ color: m.marginPct >= 0 ? "#059669" : "#DC2626" }}>{m.marginPct.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            ) : <div className="text-slate-500">No hay datos</div>}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Stock por categoría</h4>
            {stockByCategory.length ? (
              <div className="space-y-3">
                {stockByCategory.slice(0,6).map((c) => (
                  <div key={c.category} className="flex items-center justify-between">
                    <div className="text-sm text-slate-800">{c.category}</div>
                    <div className="text-sm text-slate-500">{c.stock} uds • {c.avgDaily}/día • {c.daysLeft === -1 ? "∞" : `${c.daysLeft} días`}</div>
                  </div>
                ))}
              </div>
            ) : <div className="text-slate-500">No hay datos</div>}
          </div>
        </div>

        {/* Row: Sales growth, forecast, top profitable */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-slate-800 mb-2">Crecimiento de ventas (últimos 7 días)</h4>
            <div className="text-3xl font-bold text-slate-800">{salesGrowth.rate}%</div>
            <div className="text-xs text-slate-500 mt-1">Actual: {currency(salesGrowth.current)} • Anterior: {currency(salesGrowth.previous)}</div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Pronóstico básico (7 días)</h4>
            {salesForecast.series.length ? (
              <Line data={{
                labels: [...salesForecast.series.map(s=>s.day), ...salesForecast.forecast.map(f=>f.day)],
                datasets: [
                  { label: "Histórico", data: salesForecast.series.map(s=>s.value), borderColor: "#06B6D4", tension: 0.3 },
                  { label: "Pronóstico", data: Array(salesForecast.series.length).fill(null).concat(salesForecast.forecast.map(f=>f.forecast)), borderColor: "#F59E0B", borderDash: [6,4], tension: 0.3 }
                ]
              }} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
            ) : <div className="text-slate-500">No hay datos suficientes</div>}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Top 5 Productos más rentables</h4>
            {topProfitProducts.length ? (
              <ol className="space-y-2">
                {topProfitProducts.map((p,i)=>(
                  <li key={p.name} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{i+1}. {p.name}</div>
                      <div className="text-xs text-slate-500">Ganancia: {currency(p.gain)} • Margen: {p.marginPct.toFixed(1)}%</div>
                    </div>
                    <div className="text-sm font-semibold text-slate-800">{currency(p.gain)}</div>
                  </li>
                ))}
              </ol>
            ) : <div className="text-slate-500">No hay datos</div>}
          </div>
        </div>

        {/* Footer microcopy */}
        <div className="text-xs text-slate-400">Nota: cálculos aproximados basados en los datos disponibles. Para precisión total conecta los servicios reales y asegura que cada venta incluya `product_id` y `sale_price` por línea.</div>
      </div>
    </div>
  );
}

/* Small icon component used in header button to avoid extra imports inline */
function DownloadIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 10l5 5 5-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 15V3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
