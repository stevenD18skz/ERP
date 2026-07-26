// ReportsPage.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getDailyCloses } from "@/services/dailyCloses.service";
import { getSales } from "@/services/sales.service";
import { currency } from "@/utils/converts";

import {
  Download,
  Printer,
  Search,
  AlertTriangle,
  Info,
  UserRound,
  Hourglass,
  Loader2,
} from "lucide-react";

/*
  ReportsPage
  - Implementación del diseño "Reportes.dc.html" del proyecto de Claude Design
    "ERP para tiendas y supermercados", portado a Tailwind y montado sobre el
    shell de la app (sidebar + TopBar) en vez de la barra superior del mockup.
  - El mockup corría sobre datos generados: 12 productos con ritmo sintético,
    120 días de ventas hechas con un LCG, 3 fiados y porcentajes de medios de
    pago escritos a mano. Aquí todo sale de los cierres diarios reales, y los
    bloques que necesitan información por transacción —que el Excel nunca
    guardó— muestran un estado de espera en vez de cifras inventadas. Se llenan
    solos apenas se registren ventas una por una desde /sales.
  - La gráfica es de barras en CSS, igual que el diseño: no necesita Chart.js.
*/

const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTH_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DAY_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DAY_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const RANGE_PRESETS = [
  { key: "hoy", label: "Hoy", days: 1 },
  { key: "7", label: "Últimos 7 días", days: 7 },
  { key: "30", label: "Últimos 30 días", days: 30 },
  { key: "mes", label: "Este mes", days: null },
  { key: "custom", label: "Elegir fechas", days: null },
];

const parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayDiff = (a, b) => Math.round((a - b) / 86400000);

const formatShort = (n) => {
  const v = Math.abs(n);
  if (v >= 1000000) return `$${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${Math.round(n)}`;
};

const aggregate = (rows) =>
  rows.reduce(
    (a, c) => ({
      ventas: a.ventas + c.sales_total,
      ganancia: a.ganancia + c.gain,
      gasto: a.gasto + c.expenses_total,
      compra: a.compra + c.purchases_total,
    }),
    { ventas: 0, ganancia: 0, gasto: 0, compra: 0 },
  );

export default function ReportsPage() {
  const [closes, setCloses] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rangeKey, setRangeKey] = useState("7");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [metric, setMetric] = useState("ventas");
  const [selectedBarKey, setSelectedBarKey] = useState(null);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [c, s] = await Promise.all([getDailyCloses(), getSales()]);
        if (!alive) return;
        setCloses([...c]);
        setSales([...s]);
        // El rango personalizado arranca en las dos últimas semanas con datos.
        if (c.length) {
          setCustomTo(c[0].date);
          setCustomFrom(iso(addDays(parseISO(c[0].date), -13)));
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Los períodos se anclan al último día con datos, no a la fecha del sistema:
  // la contabilidad importada llega hasta diciembre de 2025 y, si se contara
  // desde hoy, todos los rangos saldrían vacíos. Cuando ese día no es hoy, la
  // página lo advierte arriba.
  const refDate = useMemo(
    () => (closes.length ? parseISO(closes[0].date) : new Date()),
    [closes],
  );
  const isStale = useMemo(() => iso(refDate) !== iso(new Date()), [refDate]);

  const { from, to, rangeError } = useMemo(() => {
    if (rangeKey === "mes") {
      return {
        from: new Date(refDate.getFullYear(), refDate.getMonth(), 1),
        to: refDate,
        rangeError: null,
      };
    }
    if (rangeKey === "custom") {
      if (!customFrom || !customTo) return { from: refDate, to: refDate, rangeError: null };
      const f = parseISO(customFrom);
      const t = parseISO(customTo);
      if (f > t) {
        return { from: t, to: t, rangeError: 'La fecha "Desde" debe ser anterior a "Hasta".' };
      }
      return { from: f, to: t, rangeError: null };
    }
    const preset = RANGE_PRESETS.find((r) => r.key === rangeKey);
    const n = preset?.days ?? 7;
    return { from: addDays(refDate, -(n - 1)), to: refDate, rangeError: null };
  }, [rangeKey, customFrom, customTo, refDate]);

  const inRange = useMemo(() => {
    const f = iso(from);
    const t = iso(to);
    return closes
      .filter((c) => c.date >= f && c.date <= t)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [closes, from, to]);

  const prevInRange = useMemo(() => {
    const span = Math.max(1, dayDiff(to, from) + 1);
    const pTo = addDays(from, -1);
    const pFrom = addDays(pTo, -(span - 1));
    const f = iso(pFrom);
    const t = iso(pTo);
    return closes.filter((c) => c.date >= f && c.date <= t);
  }, [closes, from, to]);

  const cur = useMemo(() => aggregate(inRange), [inRange]);
  const prev = useMemo(() => aggregate(prevInRange), [prevInRange]);

  const span = Math.max(1, dayDiff(to, from) + 1);
  const fmtD = (d) => `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
  const rangeDescription =
    span === 1
      ? `${DAY_LONG[to.getDay()]}, ${to.getDate()} de ${MONTH_LONG[to.getMonth()]} de ${to.getFullYear()}`
      : `Del ${fmtD(from)} al ${fmtD(to)} · ${span} días`;

  const delta = (a, b) => {
    if (b === 0) return a === 0 ? { label: "Sin cambio", dir: "flat" } : { label: "Nuevo", dir: "up" };
    const pct = Math.round(((a - b) / b) * 100);
    if (pct === 0) return { label: "Igual que antes", dir: "flat" };
    return { label: `${pct > 0 ? "+" : ""}${pct}% vs. período anterior`, dir: pct > 0 ? "up" : "down" };
  };

  const margenPct = cur.ventas > 0 ? Math.round((cur.ganancia / cur.ventas) * 100) : 0;
  const prevMargen = prev.ventas > 0 ? Math.round((prev.ganancia / prev.ventas) * 100) : 0;

  const kpis = [
    { label: "Vendiste", value: currency(cur.ventas), valueClass: "text-slate-900", d: delta(cur.ventas, prev.ventas) },
    { label: "Ganaste", value: currency(cur.ganancia), valueClass: "text-emerald-600", d: delta(cur.ganancia, prev.ganancia) },
    { label: "Gastaste", value: currency(cur.gasto), valueClass: "text-rose-600", d: delta(cur.gasto, prev.gasto) },
    { label: "De cada $100 que vendes, ganas", value: `$${margenPct}`, valueClass: "text-slate-900", d: delta(margenPct, prevMargen) },
  ];

  // Barras por día; cuando el rango pasa de un mes se agrupan por semana.
  const buckets = useMemo(() => {
    if (inRange.length === 0) return [];
    if (inRange.length > 31) {
      const out = [];
      for (let i = 0; i < inRange.length; i += 7) {
        const chunk = inRange.slice(i, i + 7);
        const first = parseISO(chunk[0].date);
        const last = parseISO(chunk[chunk.length - 1].date);
        out.push({
          key: `w${i}`,
          label: `${first.getDate()}-${last.getDate()} ${MONTH_SHORT[last.getMonth()]}`,
          longLabel: `Semana del ${first.getDate()} al ${last.getDate()} de ${MONTH_LONG[last.getMonth()]}`,
          ...aggregate(chunk),
        });
      }
      return out;
    }
    return inRange.map((c) => {
      const d = parseISO(c.date);
      return {
        key: c.date,
        label: inRange.length > 14 ? String(d.getDate()) : DAY_SHORT[d.getDay()],
        longLabel: `${DAY_LONG[d.getDay()]} ${d.getDate()} de ${MONTH_LONG[d.getMonth()]}`,
        ventas: c.sales_total,
        ganancia: c.gain,
        gasto: c.expenses_total,
        compra: c.purchases_total,
      };
    });
  }, [inRange]);

  const maxBucket = Math.max(1, ...buckets.map((b) => b[metric]));
  const lastKey = buckets.length ? buckets[buckets.length - 1].key : null;
  const selBucket = buckets.find((b) => b.key === selectedBarKey) ?? null;
  const barMinWidth = buckets.length > 20 ? 22 : buckets.length > 10 ? 34 : 44;
  const barGap = buckets.length > 20 ? "gap-1" : "gap-2.5";

  const fiadoPendiente = useMemo(
    () => sales.filter((s) => s.payment_method === "fiado" && !s.voided),
    [sales],
  );

  const exportCsv = () => {
    const head = "fecha,venta,ganancia,gasto,compra,entrada_caja,salida_caja";
    const body = inRange
      .map((c) =>
        [
          c.date,
          c.sales_total,
          c.gain,
          c.expenses_total,
          c.purchases_total,
          c.cash_in ?? "",
          c.cash_out ?? "",
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_${iso(from)}_${iso(to)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando reportes…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-16">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3.5">
        <div>
          <h1 className="text-[26px] font-extrabold text-slate-900">Reportes</h1>
          <p className="mt-1 text-[15px] text-slate-500">{rangeDescription}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={exportCsv}
            className="flex h-11 items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Download className="h-[18px] w-[18px]" />
            Descargar Excel
          </button>
          <button
            onClick={() => window.print()}
            className="flex h-11 items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Printer className="h-[18px] w-[18px]" />
            Imprimir
          </button>
        </div>
      </div>

      {isStale && (
        <div className="flex gap-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900 ring-1 ring-blue-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <p>
            Los períodos se cuentan desde el{" "}
            <strong>
              último día con datos ({fmtD(refDate)} de {refDate.getFullYear()})
            </strong>
            , no desde hoy. Es hasta donde llega la contabilidad importada del Excel.
          </p>
        </div>
      )}

      {/* Selector de período */}
      <section className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm">
        <div className="mb-2.5 text-[13px] font-bold text-slate-500">
          ¿Qué período quieres ver?
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((r) => {
            const active = rangeKey === r.key;
            return (
              <button
                key={r.key}
                onClick={() => {
                  setRangeKey(r.key);
                  setSelectedBarKey(null);
                }}
                className={`h-11 rounded-[10px] border-[1.5px] px-4 text-sm font-bold transition-colors ${
                  active
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {rangeKey === "custom" && (
          <div className="mt-3.5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3.5">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-slate-900">Desde</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setSelectedBarKey(null);
                }}
                className="h-11 rounded-[10px] border border-slate-200 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-slate-900">Hasta</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setSelectedBarKey(null);
                }}
                className="h-11 rounded-[10px] border border-slate-200 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            {rangeError && (
              <div className="pb-3 text-[12.5px] font-semibold text-red-600">{rangeError}</div>
            )}
          </div>
        )}
      </section>

      {/* KPIs */}
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="text-[13px] font-bold text-slate-500">{k.label}</div>
            <div className={`mt-1.5 text-2xl font-extrabold tabular-nums ${k.valueClass}`}>
              {k.value}
            </div>
            <DeltaChip d={k.d} />
          </div>
        ))}
      </div>

      {/* Gráfica de tendencia */}
      <section className="rounded-xl border border-slate-100 bg-white p-[18px] shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-base font-bold text-slate-900">
              {metric === "ventas" ? "Cuánto vendiste cada día" : "Cuánto ganaste cada día"}
            </div>
            <div className="mt-0.5 text-[13px] text-slate-500">
              Toca una barra para ver el detalle de ese día
            </div>
          </div>
          <div className="flex overflow-hidden rounded-[10px] border border-slate-200">
            {[
              { key: "ventas", label: "Ventas" },
              { key: "ganancia", label: "Ganancia" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={`h-10 px-4 text-[13.5px] font-bold transition-colors ${
                  metric === m.key
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {buckets.length === 0 ? (
          <EmptyRange />
        ) : (
          <div className={`flex h-[170px] items-end overflow-x-auto pb-0.5 ${barGap}`}>
            {buckets.map((b) => {
              const selected = selectedBarKey === b.key;
              const isLast = b.key === lastKey;
              const heightPx = Math.max(6, Math.round((b[metric] / maxBucket) * 122));
              return (
                <button
                  key={b.key}
                  onClick={() => setSelectedBarKey(selected ? null : b.key)}
                  aria-label={`${b.longLabel}: ${currency(b[metric])}`}
                  style={{ flex: `1 0 ${barMinWidth}px` }}
                  className="flex h-full flex-col items-center justify-end gap-1.5"
                >
                  <div
                    className={`whitespace-nowrap text-[10.5px] tabular-nums ${
                      selected ? "font-bold text-blue-700" : "font-medium text-slate-400"
                    }`}
                  >
                    {formatShort(b[metric])}
                  </div>
                  <div
                    style={{ height: `${heightPx}px` }}
                    className={`w-full max-w-[40px] rounded-b-sm rounded-t-[5px] ${
                      selected ? "bg-blue-700" : isLast ? "bg-blue-600" : "bg-blue-200"
                    }`}
                  />
                  <div
                    className={`whitespace-nowrap text-[11.5px] font-bold ${
                      selected || isLast ? "text-blue-700" : "text-slate-400"
                    }`}
                  >
                    {b.label}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selBucket && (
          <div className="mt-4 flex flex-wrap items-center gap-3.5 rounded-[10px] bg-blue-50 p-3.5">
            <div className="min-w-[180px] flex-1">
              <div className="text-sm font-extrabold text-blue-700">{selBucket.longLabel}</div>
              <div className="mt-1 text-[13px] text-slate-700">
                {currency(selBucket.ventas)} vendidos · {currency(selBucket.ganancia)} de ganancia ·{" "}
                {currency(selBucket.gasto)} de gasto · {currency(selBucket.compra)} en compras
              </div>
            </div>
            <button
              onClick={() => setSelectedBarKey(null)}
              className="h-[38px] rounded-[9px] border border-blue-200 bg-white px-3.5 text-[13px] font-bold text-blue-700"
            >
              Cerrar
            </button>
          </div>
        )}
      </section>

      {/* Rendimiento por producto */}
      <section className="rounded-xl border border-slate-100 bg-white p-[18px] shadow-sm">
        <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-base font-bold text-slate-900">
              ¿Qué se vendió y cuánto ganaste?
            </div>
            <div className="mt-0.5 text-[13px] text-slate-500">
              Toca un producto para ver cómo se vendió día por día
            </div>
          </div>
          <div className="relative min-w-[220px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar producto..."
              disabled
              className="h-11 w-full rounded-[10px] border border-slate-200 pl-10 pr-3.5 text-[14.5px] disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>
        </div>
        <WaitingForData
          title="Esperando datos para mostrar esta tabla"
          detail="Para saber cuántas unidades salió cada producto y cuánto dejó, hacen falta ventas registradas una por una. El Excel solo guardaba el total del día, sin decir qué se vendió."
          cta="Registrar una venta"
        />
      </section>

      {/* Tarjetas de alertas */}
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]">
        <InsightCard
          icon={AlertTriangle}
          iconBg="bg-amber-100"
          iconColor="text-amber-800"
          title="Se te van a acabar pronto"
          subtitle="Según lo que has vendido en este período"
        >
          <WaitingForData
            compact
            title="Esperando datos"
            detail="Necesita el inventario cargado y ventas por producto para calcular cuánto te dura cada cosa."
            cta="Cargar inventario"
            href="/products"
          />
        </InsightCard>

        <InsightCard
          icon={Info}
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
          title="Plata quieta en la estantería"
          subtitle="Tienes stock pero nadie los compró en este período"
        >
          <WaitingForData
            compact
            title="Esperando datos"
            detail="Se calcula cruzando el stock con lo vendido. Hoy los 435 productos están en cero."
            cta="Cargar inventario"
            href="/products"
          />
        </InsightCard>

        <InsightCard
          icon={UserRound}
          iconBg="bg-amber-100"
          iconColor="text-amber-800"
          title="Fiado por cobrar"
          subtitle="Ventas a crédito que aún no te han pagado"
        >
          {fiadoPendiente.length > 0 ? (
            <FiadoList rows={fiadoPendiente} />
          ) : (
            <WaitingForData
              compact
              title="Esperando datos"
              detail="Aparece cuando registres una venta con método de pago «fiado» y el nombre del cliente."
              cta="Registrar una venta"
            />
          )}
        </InsightCard>
      </div>

      {/* Medios de pago */}
      <section className="rounded-xl border border-slate-100 bg-white p-[18px] shadow-sm">
        <div className="text-base font-bold text-slate-900">¿Cómo te pagaron?</div>
        <div className="mb-4 mt-0.5 text-[13px] text-slate-500">
          Útil para saber cuánta plata entró en efectivo a la caja
        </div>
        <WaitingForData
          title="Esperando datos para mostrar esta gráfica"
          detail="El método de pago se guarda en cada venta. El Excel no lo registraba, así que este corte empieza desde la primera venta que hagas en la aplicación."
          cta="Registrar una venta"
        />
      </section>
    </div>
  );
}

function DeltaChip({ d }) {
  const tone =
    d.dir === "up"
      ? "bg-emerald-50 text-emerald-700"
      : d.dir === "down"
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-600";
  return (
    <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {d.dir === "up" && <polyline points="18 15 12 9 6 15" />}
        {d.dir === "down" && <polyline points="6 9 12 15 18 9" />}
        {d.dir === "flat" && <line x1="5" y1="12" x2="19" y2="12" />}
      </svg>
      {d.label}
    </div>
  );
}

function InsightCard({ icon: Icon, iconBg, iconColor, title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-[18px] shadow-sm">
      <div className="mb-1 flex items-center gap-2.5">
        <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-[9px] ${iconBg}`}>
          <Icon className={`h-[17px] w-[17px] ${iconColor}`} />
        </div>
        <div className="text-[15px] font-bold text-slate-900">{title}</div>
      </div>
      <div className="mb-3 text-[13px] text-slate-500">{subtitle}</div>
      {children}
    </div>
  );
}

function WaitingForData({ title, detail, cta, href = "/sales", compact }) {
  return (
    <div
      className={`rounded-[10px] border border-dashed border-slate-200 bg-slate-50 text-center ${
        compact ? "px-3 py-5" : "px-4 py-9"
      }`}
    >
      <Hourglass className={`mx-auto text-slate-300 ${compact ? "h-5 w-5" : "h-7 w-7"}`} />
      <div className={`mt-2 font-bold text-slate-700 ${compact ? "text-[13.5px]" : "text-[15px]"}`}>
        {title}
      </div>
      <p className={`mx-auto mt-1 max-w-md text-slate-500 ${compact ? "text-[12.5px]" : "text-[13.5px]"}`}>
        {detail}
      </p>
      {cta && (
        <Link
          href={href}
          className="mt-3 inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-[13px] font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}

function FiadoList({ rows }) {
  const total = rows.reduce((a, s) => a + s.total_amount, 0);
  return (
    <>
      <div className="mb-3 text-[26px] font-extrabold tabular-nums text-amber-800">
        {currency(total)}
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-2.5 rounded-[9px] bg-amber-50 px-3 py-2.5"
          >
            <div className="text-sm font-bold text-slate-900">{s.client_name || "Sin nombre"}</div>
            <div className="text-sm font-bold tabular-nums text-amber-800">
              {currency(s.total_amount)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EmptyRange() {
  return (
    <div className="py-14 text-center">
      <div className="text-[15px] font-bold text-slate-900">No hay datos en este período</div>
      <div className="mt-1 text-[13.5px] text-slate-500">Prueba con otro rango de fechas.</div>
    </div>
  );
}
