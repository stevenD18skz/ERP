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
  Hourglass,
} from "lucide-react";

import { currency } from "@/utils/converts";
import { products, orders, sales, dailyCloses } from "@/lib/mockDb";
import type { Product } from "@/types/product";
import type { Sale } from "@/types/sale";
import type { Order } from "@/types/order";
import type { DailyClose } from "@/types/dailyClose";

const LOW_STOCK_THRESHOLD = 10;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

// Fecha local en YYYY-MM-DD. No se usa toISOString porque convierte a UTC y en
// Colombia (UTC-5) devolvería el día siguiente durante la tarde y la noche.
function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function pctDelta(current: number, previous: number): number {
  if (previous > 0) return ((current - previous) / previous) * 100;
  return current > 0 ? 100 : 0;
}

const MONTH_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// "2025-12-31" -> "31 de diciembre de 2025"
function longDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${d} de ${MONTH_LONG[m - 1]} de ${y}`;
}

// Solo la primera letra en mayúscula. La clase capitalize de Tailwind pone en
// mayúscula cada palabra y convertía "Resumen de tu tienda" en "Resumen De Tu
// Tienda", y "26 de julio" en "26 De Julio".
function sentenceCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
    className={`group flex items-center gap-3 rounded-xl p-4 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${primary
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
  >
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${primary ? "bg-white/15" : accent
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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${positive
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
  hint,
  accent = "bg-blue-50 text-blue-600",
  valueColor = "text-slate-800",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Comparación contra el período anterior. Se omite cuando no hay con qué comparar. */
  pct?: number;
  /** Texto neutro que reemplaza al badge cuando el día todavía no tiene datos. */
  hint?: string;
  accent?: string;
  valueColor?: string;
}) => (
  <div className="flex flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
    <div className="flex items-start justify-between gap-2">
      <span className="text-sm font-medium leading-snug text-slate-500">{label}</span>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
    </div>
    <div className={`mt-2 text-2xl font-bold tabular-nums ${valueColor}`}>{value}</div>
    <div className="mt-2">
      {hint ? (
        <span className="text-xs text-slate-400">{hint}</span>
      ) : (
        pct !== undefined && <DeltaBadge pct={pct} />
      )}
    </div>
  </div>
);




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

type DayBreakdown = {
  date: string;
  ventas: number;
  ganancia: number;
  gasto: number;
  compra: number;
  costo: number;
  neto: number;
};

const DONUT_SEGMENTS = [
  {
    key: "costo",
    label: "Costo de lo que vendiste",
    hint: "Lo que te costó la mercancía que salió",
    color: "#94a3b8",
    dot: "bg-slate-400",
    bar: "bg-slate-400",
  },
  {
    key: "gasto",
    label: "Gastos del día",
    hint: "Arriendo, servicios, transporte…",
    color: "#f43f5e",
    dot: "bg-rose-500",
    bar: "bg-rose-500",
  },
  {
    key: "neto",
    label: "Te quedó",
    hint: "Ganancia después de los gastos",
    color: "#10b981",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
] as const;

const DonutCard = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-full flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:p-6">
    {children}
  </div>
);

/*
  DayMoneyDonut
  - Reemplaza la gráfica de "ventas de los últimos 7 días", que repetía lo que
    ya muestra la página de Reportes. En vez de la tendencia, responde qué pasó
    con la plata de hoy: la venta se reparte en costo de la mercancía, gastos y
    lo que realmente quedó.
  - Es una partición exacta: venta = costo + gasto + neto, porque la ganancia
    del negocio es el 19% de la venta y el costo el 81% restante.
  - Las compras a proveedores van aparte: son inversión en inventario, no un
    costo del día, así que descuadrarían la torta.
*/
const DayMoneyDonut = ({
  day,
  lastRecorded,
}: {
  day: DayBreakdown | null;
  lastRecorded: DailyClose | null;
}) => {
  if (!day || day.ventas <= 0) {
    return (
      <DonutCard>
        <h3 className="text-base font-bold text-slate-900">
          ¿En qué se repartió la plata de hoy?
        </h3>
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50">
            <Hourglass className="h-6 w-6 text-slate-300" aria-hidden />
          </span>
          <p className="mt-4 text-[15px] font-bold text-slate-700">
            Todavía no hay movimiento de hoy
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Apenas registres la primera venta o cierres el día, aquí ves en qué se
            fue la plata.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/sales"
              className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Registrar una venta
            </Link>
            <Link
              href="/summary"
              className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Ver reportes
            </Link>
          </div>
          {lastRecorded && (
            <p className="mt-5 text-xs text-slate-400">
              Último día registrado: {longDate(lastRecorded.date)} ·{" "}
              <span className="font-semibold tabular-nums text-slate-500">
                {currency(lastRecorded.sales_total)}
              </span>
            </p>
          )}
        </div>
      </DonutCard>
    );
  }

  const ate = day.neto <= 0;
  const parts = ate
    ? [
        { ...DONUT_SEGMENTS[0], value: day.costo },
        { ...DONUT_SEGMENTS[1], value: day.ventas - day.costo },
      ]
    : DONUT_SEGMENTS.map((s) => ({
        ...s,
        value: day[s.key as "costo" | "gasto" | "neto"],
      }));

  const R = 68;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <DonutCard>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-base font-bold text-slate-900">
          ¿En qué se repartió la plata de hoy?
        </h3>
        <span className="text-sm text-slate-500">
          Vendiste{" "}
          <span className="font-bold tabular-nums text-slate-900">
            {currency(day.ventas)}
          </span>
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center gap-7 md:flex-row md:items-start md:gap-9">
        {/* Torta */}
        <div className="relative shrink-0">
          <svg
            width="188"
            height="188"
            viewBox="0 0 188 188"
            role="img"
            aria-label="Reparto de la venta del día"
          >
            <g transform="rotate(-90 94 94)">
              <circle cx="94" cy="94" r={R} fill="none" stroke="#f1f5f9" strokeWidth="26" />
              {parts.map((p) => {
                const frac = day.ventas > 0 ? p.value / day.ventas : 0;
                const dash = frac * C;
                const el = (
                  <circle
                    key={p.key}
                    cx="94"
                    cy="94"
                    r={R}
                    fill="none"
                    stroke={p.color}
                    strokeWidth="26"
                    strokeDasharray={`${dash} ${C - dash}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += dash;
                return el;
              })}
            </g>
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Te quedó
            </span>
            <span
              className={`mt-0.5 text-xl font-extrabold tabular-nums ${
                ate ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {currency(Math.max(0, day.neto))}
            </span>
            <span className="text-xs font-semibold tabular-nums text-slate-400">
              {Math.round((Math.max(0, day.neto) / day.ventas) * 100)}% de la venta
            </span>
          </div>
        </div>

        {/* Desglose */}
        <div className="w-full min-w-0 flex-1 space-y-4">
          {parts.map((p) => {
            const pct = day.ventas > 0 ? (p.value / day.ventas) * 100 : 0;
            return (
              <div key={p.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${p.dot}`} />
                    <span className="truncate text-sm font-semibold text-slate-700">
                      {p.label}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-baseline gap-2">
                    <span className="text-sm font-bold tabular-nums text-slate-900">
                      {currency(p.value)}
                    </span>
                    <span className="w-9 text-right text-xs font-semibold tabular-nums text-slate-400">
                      {Math.round(pct)}%
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${p.bar}`}
                    style={{ width: `${Math.max(pct, 1.5)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">{p.hint}</p>
              </div>
            );
          })}
        </div>
      </div>

      {ate && (
        <p className="mt-5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          Los gastos de hoy se comieron toda la ganancia.
        </p>
      )}

      <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
        Además compraste{" "}
        <span className="font-bold tabular-nums text-slate-600">
          {currency(day.compra)}
        </span>{" "}
        en mercancía. Va aparte: es inversión en inventario, no un costo del día.
      </p>
    </DonutCard>
  );
};

// "2025-12-31" -> "31 dic"
function shortDate(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map(Number);
  return `${d} ${MONTH_LONG[m - 1].slice(0, 3)}`;
}

/*
  RecentCloses
  - Ocupa el lugar de la antigua tabla de "ventas recientes", que estaba vacía
    porque el Excel nunca guardó ventas individuales. Los cierres diarios sí son
    el registro real del negocio, así que este bloque siempre tiene qué mostrar.
*/
const RecentCloses = ({ items, todayIso }: { items: DailyClose[]; todayIso: string }) => (
  <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-sm font-semibold text-slate-700">Últimos cierres diarios</h3>
      <Link
        href="/summary"
        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
      >
        Ver todo
      </Link>
    </div>

    {items.length === 0 ? (
      <div className="py-8 text-center">
        <p className="text-sm font-semibold text-slate-600">
          Todavía no has cerrado ningún día
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Al final de la jornada anota cuánto vendiste y queda registrado aquí.
        </p>
        <Link
          href="/sales"
          className="mt-4 inline-flex h-9 items-center rounded-lg border border-slate-200 px-3.5 text-[13px] font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Cerrar el día
        </Link>
      </div>
    ) : (
      <div className="-mx-1 mt-1 overflow-x-auto">
        <table className="w-full min-w-[460px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-400">
              <th className="px-1 pb-2 font-medium">Día</th>
              <th className="px-1 pb-2 text-right font-medium">Venta</th>
              <th className="px-1 pb-2 text-right font-medium">Ganancia</th>
              <th className="px-1 pb-2 text-right font-medium">Gasto</th>
              <th className="px-1 pb-2 text-right font-medium">Compra</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const isToday = c.date === todayIso;
              return (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="whitespace-nowrap px-1 py-2.5 text-slate-600">
                    {isToday ? (
                      <span className="font-semibold text-blue-600">Hoy</span>
                    ) : (
                      shortDate(c.date)
                    )}
                  </td>
                  <td className="px-1 py-2.5 text-right font-semibold tabular-nums text-slate-800">
                    {currency(c.sales_total)}
                  </td>
                  <td className="px-1 py-2.5 text-right tabular-nums text-emerald-600">
                    {currency(c.gain)}
                  </td>
                  <td className="px-1 py-2.5 text-right tabular-nums text-rose-600">
                    {c.expenses_total ? currency(c.expenses_total) : "—"}
                  </td>
                  <td className="px-1 py-2.5 text-right tabular-nums text-slate-500">
                    {c.purchases_total ? currency(c.purchases_total) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default function Home() {
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length,
    [],
  );

  // Inicio siempre habla de HOY, la fecha real del sistema. Si el día todavía
  // no tiene movimiento, cada tarjeta lo dice en vez de mostrar el último día
  // registrado como si fuera hoy. El histórico completo vive en /summary.
  const {
    hasToday,
    ventasHoy,
    ventasDelta,
    gananciaHoy,
    gananciaDelta,
    promedioSemana,
    tendenciaPct,
    dayBreakdown,
    lastRecorded,
    recentCloses,
    todayIso,
  } = useMemo(() => {
    const byDate = new Map(dailyCloses.map((c) => [c.date, c]));
    const now = new Date();
    const dayAgo = (n: number) =>
      dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n));

    const todayClose = byDate.get(dayAgo(0)) ?? null;
    const yesterdayClose = byDate.get(dayAgo(1)) ?? null;

    // Promedio de los 7 días que terminan hoy, contando en cero los días sin
    // registro: si no se anotó nada, ese día no vendió nada que sepamos.
    const windowAvg = (offset: number) => {
      let sum = 0;
      for (let i = offset; i < offset + 7; i++) sum += byDate.get(dayAgo(i))?.sales_total ?? 0;
      return sum / 7;
    };

    const ordered = [...dailyCloses].sort((a, b) => b.date.localeCompare(a.date));

    const breakdown: DayBreakdown | null = todayClose
      ? {
          date: todayClose.date,
          ventas: todayClose.sales_total,
          ganancia: todayClose.gain,
          gasto: todayClose.expenses_total,
          compra: todayClose.purchases_total,
          costo: todayClose.sales_total - todayClose.gain,
          neto: todayClose.gain - todayClose.expenses_total,
        }
      : null;

    return {
      hasToday: !!todayClose,
      ventasHoy: todayClose?.sales_total ?? 0,
      ventasDelta: pctDelta(todayClose?.sales_total ?? 0, yesterdayClose?.sales_total ?? 0),
      gananciaHoy: todayClose?.gain ?? 0,
      gananciaDelta: pctDelta(todayClose?.gain ?? 0, yesterdayClose?.gain ?? 0),
      promedioSemana: windowAvg(0),
      tendenciaPct: pctDelta(windowAvg(0), windowAvg(7)),
      dayBreakdown: breakdown,
      lastRecorded: ordered[0] ?? null,
      recentCloses: ordered.slice(0, 7),
      todayIso: dayAgo(0),
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
      sentenceCase(
        new Date().toLocaleDateString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
      ),
    [],
  );

  return (
    <div className="mx-auto px-4 md:px-8">
      {/* Saludo */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div>
          <p className="text-sm font-semibold text-blue-600">{getGreeting()}</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
            Resumen de tu tienda
          </h2>
        </div>
        <p className="text-sm text-slate-500">{today}</p>
      </header>


      <main className="mt-6 space-y-6">
        {/* Indicadores del día, a todo el ancho */}
        <section
          aria-label="Indicadores clave"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <TrendCard
            icon={Wallet}
            label="Ventas de hoy"
            value={currency(ventasHoy)}
            pct={hasToday ? ventasDelta : undefined}
            hint={hasToday ? undefined : "Sin movimiento todavía"}
          />
          <TrendCard
            icon={PiggyBank}
            label="Ganancia de hoy"
            value={currency(gananciaHoy)}
            pct={hasToday ? gananciaDelta : undefined}
            hint={hasToday ? undefined : "Sin movimiento todavía"}
            accent="bg-emerald-50 text-emerald-600"
            valueColor="text-emerald-600"
          />
          <TrendCard
            icon={CalendarClock}
            label="Promedio diario (últimos 7 días)"
            value={currency(promedioSemana)}
            pct={promedioSemana > 0 ? tendenciaPct : undefined}
            hint={promedioSemana > 0 ? undefined : "Sin ventas esta semana"}
            accent="bg-indigo-50 text-indigo-600"
          />
          <Link
            href={`/products?stockOp=lt&stockVal=${LOW_STOCK_THRESHOLD + 1}`}
            className="flex flex-col rounded-xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-medium leading-snug text-slate-500">
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
            <div className="mt-2 text-2xl font-bold tabular-nums text-amber-600">
              {lowStockCount}
            </div>
            <div className="mt-2 text-xs text-slate-400">productos por revisar</div>
          </Link>
        </section>

        {/* Reparto del día + accesos rápidos */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section
            aria-label="Reparto de la plata del día"
            className="lg:col-span-2"
          >
            <h2 className="sr-only">Reparto de la plata del día</h2>
            <DayMoneyDonut day={dayBreakdown} lastRecorded={lastRecorded} />
          </section>

          <section aria-label="Acciones rápidas" className="flex flex-col gap-3">
            <h2 className="sr-only">Acciones rápidas</h2>
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
          </section>
        </div>

        {/* Contenido principal */}
        <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentCloses items={recentCloses} todayIso={todayIso} />
          </div>
          <div className="space-y-6">
            <RecentActivity items={activity} />
            <TopProductsHome items={topProductsHome} />
          </div>
        </section>






      </main>
    </div>
  );
}
