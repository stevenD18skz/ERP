// DailyCloseMode.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getDailyCloses,
  createDailyClose,
} from "@/services/dailyCloses.service";
import { currency } from "@/utils/converts";
import { localDateKey } from "@/utils/dates";

import {
  CalendarDays,
  TrendingUp,
  Receipt,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";

/*
  DailyCloseMode
  - Segundo modo de la página de Ventas: en vez de registrar venta por venta,
    se anota un único total al cerrar el día. Es exactamente como venía
    trabajando el negocio en Hoja1 del Excel.
  - La ganancia se propone como el 19% de la venta, que es la fórmula que traía
    el Excel, pero queda editable por si ese día el margen fue otro.
*/

const PAGE_SIZE = 15;
const GAIN_RATE = 0.19;

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const today = () => localDateKey();
const formatDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const emptyForm = () => ({
  date: today(),
  sales_total: "",
  gain: "",
  expenses_total: "",
  purchases_total: "",
  cash_in: "",
  cash_out: "",
});

export default function DailyCloseMode({ onNotify }) {
  const [closes, setCloses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [gainTouched, setGainTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const [yearFilter, setYearFilter] = useState("todos");
  const [monthFilter, setMonthFilter] = useState("todos");
  const [page, setPage] = useState(1);

  const notify = onNotify ?? (() => {});

  const reload = async () => {
    const data = await getDailyCloses();
    setCloses([...data]);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getDailyCloses();
        if (alive) setCloses([...data]);
      } catch {
        if (alive) notify("No se pudieron cargar los cierres", "error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La ganancia sigue al 19% de la venta mientras no se edite a mano.
  const suggestedGain = useMemo(() => {
    const v = Number(form.sales_total);
    return Number.isFinite(v) && v > 0 ? Math.round(v * GAIN_RATE) : 0;
  }, [form.sales_total]);

  const gainValue = gainTouched ? form.gain : suggestedGain ? String(suggestedGain) : "";

  const years = useMemo(() => {
    const set = new Set(closes.map((c) => c.date.slice(0, 4)));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [closes]);

  const filtered = useMemo(
    () =>
      closes.filter((c) => {
        if (yearFilter !== "todos" && c.date.slice(0, 4) !== yearFilter) return false;
        if (monthFilter !== "todos" && c.date.slice(5, 7) !== monthFilter) return false;
        return true;
      }),
    [closes, yearFilter, monthFilter],
  );

  const totals = useMemo(() => {
    const acc = (key) => filtered.reduce((a, c) => a + (c[key] ?? 0), 0);
    return {
      venta: acc("sales_total"),
      ganancia: acc("gain"),
      gasto: acc("expenses_total"),
      compra: acc("purchases_total"),
      dias: filtered.length,
    };
  }, [filtered]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  useEffect(() => setPage(1), [yearFilter, monthFilter]);

  const numeric = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    const sales_total = numeric(form.sales_total);
    if (!form.date) return notify("Falta la fecha del cierre", "error");
    if (sales_total <= 0) return notify("La venta del día debe ser mayor que cero", "error");

    setSaving(true);
    try {
      await createDailyClose({
        date: form.date,
        sales_total,
        gain: numeric(gainValue),
        expenses_total: numeric(form.expenses_total),
        purchases_total: numeric(form.purchases_total),
        cash_in: form.cash_in === "" ? null : numeric(form.cash_in),
        cash_out: form.cash_out === "" ? null : numeric(form.cash_out),
      });
      await reload();
      setForm(emptyForm());
      setGainTouched(false);
      notify(`Cierre del ${formatDate(form.date)} guardado`, "success");
    } catch (err) {
      notify(err.message || "No se pudo guardar el cierre", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 min-h-screen">



      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Formulario */}
        <form
          onSubmit={submit}
          className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100 lg:col-span-1"
        >
          <h2 className="flex items-center gap-2 font-semibold text-slate-800">
            <CalendarDays className="h-4 w-4 text-teal-600" />
            Cerrar un día
          </h2>

          <div className="mt-4 space-y-3">
            <Field label="Fecha">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </Field>

            <Field label="Venta del día">
              <MoneyInput
                value={form.sales_total}
                onChange={(v) => setForm((f) => ({ ...f, sales_total: v }))}
                autoFocus
              />
            </Field>

            <Field
              label="Ganancia"
              hint={
                !gainTouched && suggestedGain > 0
                  ? "Calculada al 19%, editable"
                  : undefined
              }
            >
              <MoneyInput
                value={gainValue}
                onChange={(v) => {
                  setGainTouched(true);
                  setForm((f) => ({ ...f, gain: v }));
                }}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Gasto">
                <MoneyInput
                  value={form.expenses_total}
                  onChange={(v) => setForm((f) => ({ ...f, expenses_total: v }))}
                />
              </Field>
              <Field label="Compra">
                <MoneyInput
                  value={form.purchases_total}
                  onChange={(v) => setForm((f) => ({ ...f, purchases_total: v }))}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Entrada de caja">
                <MoneyInput
                  value={form.cash_in}
                  onChange={(v) => setForm((f) => ({ ...f, cash_in: v }))}
                />
              </Field>
              <Field label="Salida de caja">
                <MoneyInput
                  value={form.cash_out}
                  onChange={(v) => setForm((f) => ({ ...f, cash_out: v }))}
                />
              </Field>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar cierre
          </button>
        </form>

        {/* Histórico */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Venta" value={totals.venta} icon={TrendingUp} tone="teal" />
            <Stat label="Ganancia" value={totals.ganancia} icon={TrendingUp} tone="emerald" />
            <Stat label="Gasto" value={totals.gasto} icon={Receipt} tone="rose" />
            <Stat label="Compra" value={totals.compra} icon={Package} tone="amber" />
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
              <h3 className="mr-auto text-sm font-semibold text-slate-800">
                Historial de cierres
                <span className="ml-2 font-normal text-slate-400">
                  {totals.dias} {totals.dias === 1 ? "día" : "días"}
                </span>
              </h3>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-teal-500"
                aria-label="Filtrar por año"
              >
                <option value="todos">Todos los años</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-teal-500"
                aria-label="Filtrar por mes"
              >
                <option value="todos">Todos los meses</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando cierres…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  No hay cierres en ese periodo
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Fecha</th>
                        <th className="px-4 py-2.5 text-right font-medium">Venta</th>
                        <th className="px-4 py-2.5 text-right font-medium">Ganancia</th>
                        <th className="px-4 py-2.5 text-right font-medium">Gasto</th>
                        <th className="px-4 py-2.5 text-right font-medium">Compra</th>
                        <th className="px-4 py-2.5 text-right font-medium">Caja</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {visible.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-4 py-2.5">
                            <span className="text-slate-700">{formatDate(c.date)}</span>
                            {c.source === "excel" && (
                              <FileSpreadsheet
                                className="ml-1.5 inline h-3 w-3 text-slate-300"
                                aria-label="Importado del Excel"
                              />
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums text-slate-800">
                            {currency(c.sales_total)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-emerald-600">
                            {currency(c.gain)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-rose-600">
                            {c.expenses_total ? currency(c.expenses_total) : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-amber-600">
                            {c.purchases_total ? currency(c.purchases_total) : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs tabular-nums text-slate-500">
                            {c.cash_in === null && c.cash_out === null ? (
                              "—"
                            ) : (
                              <>
                                {c.cash_in ? `+${currency(c.cash_in)}` : ""}
                                {c.cash_in && c.cash_out ? " / " : ""}
                                {c.cash_out ? `-${currency(c.cash_out)}` : ""}
                                {!c.cash_in && !c.cash_out ? "0" : ""}
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-sm text-slate-500">
                  <span>
                    {(current - 1) * PAGE_SIZE + 1}–
                    {Math.min(current * PAGE_SIZE, filtered.length)} de {filtered.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={current === 1}
                      className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40"
                      aria-label="Página anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 tabular-nums">
                      {current} / {pageCount}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      disabled={current === pageCount}
                      className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40"
                      aria-label="Página siguiente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function MoneyInput({ value, onChange, autoFocus }) {
  return (
    <input
      type="number"
      min="0"
      step="1"
      inputMode="numeric"
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0"
      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm tabular-nums outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
    />
  );
}

function Stat({ label, value, icon: Icon, tone }) {
  const tones = {
    teal: "bg-teal-50 text-teal-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-2">
        <span className={`rounded-md p-1.5 ${tones[tone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-semibold tabular-nums text-slate-800">
        {currency(value)}
      </p>
    </div>
  );
}
