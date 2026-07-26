"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ShoppingCart,
  PackagePlus,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  ChevronRight,
  Wallet,
  CalendarClock,
  PiggyBank,
  PackageSearch,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import { currency } from "@/utils/converts";
import { products, orders, sales } from "@/lib/mockDb";
import type { Product } from "@/types/product";
import type { Sale } from "@/types/sale";
import type { Order } from "@/types/order";

const LOW_STOCK_THRESHOLD = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shortCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function dayLabel(date: Date): string {
  const short = date.toLocaleDateString("es-CO", { weekday: "short" });
  const clean = short.replace(".", "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function pctDelta(current: number, previous: number): number {
  if (previous > 0) return ((current - previous) / previous) * 100;
  return current > 0 ? 100 : 0;
}

type ActivityItem = {
  icon: LucideIcon;
  accent: string;
  text: string;
  date: string;
};

function buildActivity(
  productsList: Product[],
  salesList: Sale[],
  ordersList: Order[],
): ActivityItem[] {
  const items: ActivityItem[] = [];

  if (salesList[0]) {
    items.push({
      icon: ShoppingCart,
      accent: "bg-blue-50 text-blue-600",
      text: `Venta registrada por ${currency(salesList[0].total_amount)}`,
      date: salesList[0].sale_date,
    });
  }
  if (ordersList[0]) {
    items.push({
      icon: ClipboardList,
      accent: "bg-indigo-50 text-indigo-600",
      text: `Pedido creado a ${ordersList[0].supplier}`,
      date: ordersList[0].order_date,
    });
  }
  const lowestStock = productsList
    .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock)[0];
  if (lowestStock) {
    items.push({
      icon: AlertTriangle,
      accent: "bg-amber-50 text-amber-600",
      text: `${lowestStock.name} con stock bajo (${lowestStock.stock} un.)`,
      date: lowestStock.created_at,
    });
  }

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);
}

const QuickAction = ({
  href,
  icon: Icon,
  label,
  hint,
  primary = false,
  accent = "bg-blue-50 text-blue-600",
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint: string;
  primary?: boolean;
  accent?: string;
}) => (
  <Link
    href={href}
    className={`group flex items-center gap-3 rounded-xl p-4 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
      primary
        ? "bg-blue-600 text-white hover:bg-blue-700"
        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
    }`}
  >
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
        primary ? "bg-white/15" : accent
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </span>
    <span className="min-w-0 text-left">
      <span className="block text-sm font-semibold">{label}</span>
      <span
        className={`block text-xs ${primary ? "text-blue-100" : "text-slate-400"}`}
      >
        {hint}
      </span>
    </span>
  </Link>
);

const DeltaBadge = ({ pct }: { pct: number }) => {
  const positive = pct >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
        positive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {positive ? "+" : ""}
      {pct.toFixed(0)}%
    </span>
  );
};

const TrendCard = ({
  icon: Icon,
  label,
  value,
  pct,
  accent = "bg-blue-50 text-blue-600",
  valueColor = "text-slate-800",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  pct: number;
  accent?: string;
  valueColor?: string;
}) => (
  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
    <div className="flex items-start justify-between gap-2">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
    </div>
    <div
      className={`mt-3 text-2xl font-bold tabular-nums ${valueColor}`}
    >
      {value}
    </div>
    <div className="mt-2">
      <DeltaBadge pct={pct} />
    </div>
  </div>
);

const LowStockBanner = ({
  items,
  threshold,
}: {
  items: Product[];
  threshold: number;
}) => {
  const low = items
    .filter((p) => p.stock <= threshold)
    .sort((a, b) => a.stock - b.stock);
  if (low.length === 0) return null;

  const names = low
    .slice(0, 3)
    .map((p) => p.name)
    .join(", ");
  const extra = low.length > 3 ? ` y ${low.length - 3} más` : "";

  return (
    <Link
      href={`/products?stockOp=lt&stockVal=${threshold + 1}`}
      className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <AlertTriangle className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-900">
          {low.length} producto{low.length > 1 ? "s" : ""} con stock bajo
        </p>
        <p className="truncate text-xs text-amber-700">
          {names}
          {extra} — Toca para revisarlos
        </p>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-amber-500 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
};

const TopProductsHome = ({ items }: { items: Product[] }) => (
  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
    <h3 className="text-sm font-semibold text-slate-700">
      Productos con más existencias
    </h3>
    {items.length === 0 ? (
      <p className="mt-3 text-sm text-slate-400">Aún no hay productos.</p>
    ) : (
      <ul className="mt-3 space-y-3">
        {items.map((p: Product) => (
          <li key={p.id} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-slate-800">
                {p.name}
              </div>
              <div className="text-xs text-slate-400">
                {p.category} ·{" "}
                <span
                  className={
                    p.stock <= LOW_STOCK_THRESHOLD
                      ? "font-medium text-amber-600"
                      : ""
                  }
                >
                  stock {p.stock}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
              {currency(p.price)}
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const RecentActivity = ({ items }: { items: ActivityItem[] }) => (
  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
    <h3 className="text-sm font-semibold text-slate-700">
      Actividad reciente
    </h3>
    {items.length === 0 ? (
      <p className="mt-3 text-sm text-slate-400">Sin actividad todavía.</p>
    ) : (
      <ul className="mt-3 space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${item.accent}`}
            >
              <item.icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-slate-700">{item.text}</p>
              <p className="text-xs text-slate-400">
                {new Date(item.date).toLocaleString("es-CO", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

type WeekBar = {
  key: string;
  label: string;
  value: number;
  isToday: boolean;
};

const WeekTrendChart = ({
  bars,
  total,
  pct,
}: {
  bars: WeekBar[];
  total: number;
  pct: number;
}) => {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const positive = pct >= 0;
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 md:p-5">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900">
          Ventas de los últimos 7 días
        </h3>
        <div className="text-sm text-slate-500">
          Total:{" "}
          <span className="font-bold tabular-nums text-slate-900">
            {currency(total)}
          </span>{" "}
          ·{" "}
          <span
            className={`font-bold ${positive ? "text-emerald-600" : "text-red-600"}`}
          >
            {positive ? "+" : ""}
            {pct.toFixed(0)}%
          </span>{" "}
          vs. semana pasada
        </div>
      </div>
      <div className="flex h-[150px] items-end gap-3 px-1 sm:gap-5">
        {bars.map((bar) => {
          const heightPx = bar.value > 0 ? Math.max(8, (bar.value / max) * 132) : 4;
          return (
            <div
              key={bar.key}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <div className="text-xs tabular-nums text-slate-400">
                {bar.value > 0 ? shortCurrency(bar.value) : ""}
              </div>
              <div
                className={`w-full max-w-[44px] rounded-xl ${
                  bar.isToday ? "bg-blue-600" : "bg-blue-200"
                }`}
                style={{ height: `${heightPx}px` }}
              />
              <div
                className={`text-sm font-bold ${
                  bar.isToday ? "text-blue-600" : "text-slate-700"
                }`}
              >
                {bar.isToday ? "Hoy" : bar.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RecentSalesTable = ({ items }: { items: Sale[] }) => (
  <div className="overflow-auto rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
    <h3 className="text-sm font-semibold text-slate-700">Ventas recientes</h3>
    {items.length === 0 ? (
      <p className="mt-4 py-6 text-center text-sm text-slate-400">
        Aún no se han registrado ventas.
      </p>
    ) : (
      <table className="mt-3 w-full text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-slate-400">
            <th className="pb-2 font-medium">Fecha</th>
            <th className="pb-2 font-medium">Total</th>
            <th className="pb-2 font-medium">Ganancia</th>
            <th className="pb-2 font-medium">Productos</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => {
            const names = s.products.map((p) => p.product);
            const preview = names.slice(0, 2).join(", ");
            const extra =
              names.length > 2 ? ` +${names.length - 2} más` : "";
            return (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="py-3 text-slate-600">
                  {new Date(s.sale_date).toLocaleString("es-CO", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-3 font-semibold tabular-nums text-slate-800">
                  {currency(s.total_amount)}
                </td>
                <td className="py-3 tabular-nums text-emerald-600">
                  {currency(s.gain)}
                </td>
                <td
                  className="py-3 text-slate-600"
                  title={names.join(", ")}
                >
                  {preview}
                  {extra}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </div>
);

export default function Home() {
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length,
    [],
  );

  const {
    ventasHoy,
    ventasDelta,
    gananciaHoy,
    gananciaDelta,
    promedioSemana,
    tendenciaPct,
    weekBars,
    weekTotal,
  } = useMemo(() => {
    const byDay = new Map<string, { total: number; gain: number }>();
    for (const s of sales) {
      const key = dayKey(new Date(s.sale_date));
      const acc = byDay.get(key) ?? { total: 0, gain: 0 };
      acc.total += s.total_amount;
      acc.gain += s.gain;
      byDay.set(key, acc);
    }

    const latestMs = sales.length
      ? Math.max(...sales.map((s) => new Date(s.sale_date).getTime()))
      : Date.now();
    const latest = new Date(latestMs);

    const bars: WeekBar[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(latest.getTime() - (6 - i) * DAY_MS);
      const key = dayKey(d);
      return {
        key,
        label: dayLabel(d),
        value: byDay.get(key)?.total ?? 0,
        isToday: i === 6,
      };
    });

    const todayKey = dayKey(latest);
    const yesterdayKey = dayKey(new Date(latest.getTime() - DAY_MS));
    const today = byDay.get(todayKey) ?? { total: 0, gain: 0 };
    const yesterday = byDay.get(yesterdayKey) ?? { total: 0, gain: 0 };

    const firstHalf = bars.slice(0, 3).reduce((s, b) => s + b.value, 0) / 3;
    const secondHalf = bars.slice(4, 7).reduce((s, b) => s + b.value, 0) / 3;
    const total = bars.reduce((s, b) => s + b.value, 0);

    return {
      ventasHoy: today.total,
      ventasDelta: pctDelta(today.total, yesterday.total),
      gananciaHoy: today.gain,
      gananciaDelta: pctDelta(today.gain, yesterday.gain),
      promedioSemana: total / 7,
      tendenciaPct: pctDelta(secondHalf, firstHalf),
      weekBars: bars,
      weekTotal: total,
    };
  }, []);

  const topProductsHome = useMemo(
    () =>
      products
        .slice()
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5),
    [],
  );

  const activity = useMemo(
    () => buildActivity(products, sales, orders),
    [],
  );

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    [],
  );

  return (
    <main className="mx-auto space-y-6 p-4 md:p-8">
      {/* Saludo */}
      <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">
        <p className="text-sm font-semibold text-blue-600">
          {getGreeting()}
        </p>
        <h2 className="mt-1 text-2xl font-bold capitalize text-slate-900 md:text-3xl">
          Resumen de tu tienda
        </h2>
        <p className="mt-1 text-sm capitalize text-slate-500">{today}</p>
      </header>

      {/* Acciones rápidas: lo primero que necesita el tendero */}
      <section aria-label="Acciones rápidas">
        <h2 className="sr-only">Acciones rápidas</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/sales"
            icon={ShoppingCart}
            label="Registrar venta"
            hint="Nueva transacción"
            primary
          />
          <QuickAction
            href="/products?new=1"
            icon={PackagePlus}
            label="Nuevo producto"
            hint="Agregar al catálogo"
            accent="bg-emerald-50 text-emerald-600"
          />
          <QuickAction
            href="/orders"
            icon={ClipboardList}
            label="Crear pedido"
            hint="Solicitar a proveedor"
            accent="bg-indigo-50 text-indigo-600"
          />
          <QuickAction
            href="/summary"
            icon={BarChart3}
            label="Ver reportes"
            hint="Resumen del negocio"
            accent="bg-violet-50 text-violet-600"
          />
        </div>
      </section>

      {/* Alerta de stock bajo — visible sin desplazarse */}
      <LowStockBanner items={products} threshold={LOW_STOCK_THRESHOLD} />

      {/* KPIs */}
      <section
        aria-label="Indicadores clave"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <TrendCard
          icon={Wallet}
          label="Ventas de hoy"
          value={currency(ventasHoy)}
          pct={ventasDelta}
        />
        <TrendCard
          icon={CalendarClock}
          label="Promedio diario (7 días)"
          value={currency(promedioSemana)}
          pct={tendenciaPct}
          accent="bg-indigo-50 text-indigo-600"
        />
        <TrendCard
          icon={PiggyBank}
          label="Ganancia de hoy"
          value={currency(gananciaHoy)}
          pct={gananciaDelta}
          accent="bg-emerald-50 text-emerald-600"
          valueColor="text-emerald-600"
        />
        <Link
          href={`/products?stockOp=lt&stockVal=${LOW_STOCK_THRESHOLD + 1}`}
          className="rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition-colors hover:bg-slate-50"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-slate-500">
              Stock bajo
            </span>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                lowStockCount > 0
                  ? "bg-amber-50 text-amber-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <PackageSearch className="h-4 w-4" aria-hidden />
            </span>
          </div>
          <div className="mt-3 text-2xl font-bold tabular-nums text-amber-600">
            {lowStockCount}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            productos por revisar
          </div>
        </Link>
      </section>

      {/* Tendencia de ventas de los últimos 7 días */}
      <WeekTrendChart bars={weekBars} total={weekTotal} pct={tendenciaPct} />

      {/* Contenido principal */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentSalesTable items={sales} />
        </div>
        <div className="space-y-4">
          <TopProductsHome items={topProductsHome} />
          <RecentActivity items={activity} />
        </div>
      </section>
    </main>
  );
}
