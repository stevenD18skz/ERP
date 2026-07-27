// ExpensesPage.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/services/expenses.service";
import { currency } from "@/utils/converts";
import { localDateKey } from "@/utils/dates";

import {
  Wallet,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Info,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/*
  ExpensesPage
  - Módulo de gastos y movimientos de caja. Nace de las columnas GASTO,
    DENTRADA y SALIDA de Hoja1 del Excel de 2025.
  - El Excel guardaba un único total de gasto por día, sin concepto. Por eso los
    registros importados llegan con un concepto genérico y una nota que lo
    advierte: de aquí en adelante la idea es detallarlos uno por uno.
  - Entrada y salida son movimientos de caja por fuera de las ventas. Solo se
    llevaron de enero a abril de 2025.
*/

const uid = () => Math.random().toString(36).slice(2, 9);
const PAGE_SIZE = 25;

const KIND_META = {
  gasto: {
    label: "Gasto",
    icon: Receipt,
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20",
    accent: "text-rose-600",
  },
  entrada: {
    label: "Entrada de caja",
    icon: ArrowDownLeft,
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    accent: "text-emerald-600",
  },
  salida: {
    label: "Salida de caja",
    icon: ArrowUpRight,
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    accent: "text-amber-600",
  },
};

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const today = () => localDateKey();
const formatDate = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const emptyDraft = () => ({
  id: null,
  date: today(),
  kind: "gasto",
  amount: "",
  concept: "",
  notes: "",
});

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (text, type = "info") => {
    const id = uid();
    setToasts((s) => [...s, { id, text, type }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 4000);
  };
  const dismiss = (id) => setToasts((s) => s.filter((t) => t.id !== id));
  return { toasts, push, dismiss };
}

export default function ExpensesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [kindFilter, setKindFilter] = useState("todos");
  const [monthFilter, setMonthFilter] = useState("todos");
  const [yearFilter, setYearFilter] = useState("todos");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // formulario
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { toasts, push, dismiss } = useToasts();

  const reload = async () => {
    const data = await getExpenses();
    setItems([...data]);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getExpenses();
        if (alive) setItems([...data]);
      } catch {
        if (alive) push("No se pudieron cargar los gastos", "error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const years = useMemo(() => {
    const set = new Set(items.map((e) => e.date.slice(0, 4)));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((e) => {
      if (kindFilter !== "todos" && e.kind !== kindFilter) return false;
      if (yearFilter !== "todos" && e.date.slice(0, 4) !== yearFilter) return false;
      if (monthFilter !== "todos" && e.date.slice(5, 7) !== monthFilter) return false;
      if (q && !`${e.concept} ${e.notes}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, kindFilter, monthFilter, yearFilter, query]);

  const totals = useMemo(() => {
    const sum = (kind) =>
      filtered.filter((e) => e.kind === kind).reduce((a, e) => a + e.amount, 0);
    const gasto = sum("gasto");
    const entrada = sum("entrada");
    const salida = sum("salida");
    return { gasto, entrada, salida, neto: entrada - salida - gasto };
  }, [filtered]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  useEffect(() => setPage(1), [kindFilter, monthFilter, yearFilter, query]);

  const openNew = () => setDraft(emptyDraft());
  const openEdit = (item) =>
    setDraft({ ...item, amount: String(item.amount) });

  const saveDraft = async (e) => {
    e.preventDefault();
    const amount = Number(draft.amount);
    if (!draft.date) return push("Falta la fecha", "error");
    if (!Number.isFinite(amount) || amount <= 0)
      return push("El monto debe ser mayor que cero", "error");
    if (!draft.concept.trim())
      return push("Escribe un concepto para poder identificarlo después", "error");

    setSaving(true);
    try {
      const payload = {
        date: draft.date,
        kind: draft.kind,
        amount,
        concept: draft.concept.trim(),
        notes: draft.notes.trim(),
      };
      if (draft.id) {
        await updateExpense(draft.id, payload);
        push("Registro actualizado", "success");
      } else {
        await createExpense(payload);
        push("Registro guardado", "success");
      }
      await reload();
      setDraft(null);
    } catch (err) {
      push(err.message || "No se pudo guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    try {
      await deleteExpense(confirmDelete.id);
      await reload();
      push("Registro eliminado", "success");
    } catch (err) {
      push(err.message || "No se pudo eliminar", "error");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
            <Wallet className="h-5 w-5 text-blue-600" />
            Gastos y caja
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gastos del negocio y movimientos de caja que no son ventas.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo registro
        </button>
      </div>

      {/* Aviso sobre los datos importados */}
      <div className="flex gap-3 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <p>
          Los registros de 2025 vienen del Excel, que solo guardaba{" "}
          <strong>un total de gasto por día</strong> sin decir en qué se fue. Por eso
          aparecen sin detallar. Las entradas y salidas de caja solo se llevaron de
          enero a abril.
        </p>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Gastos"
          value={totals.gasto}
          icon={Receipt}
          tone="rose"
        />
        <SummaryCard
          label="Entradas de caja"
          value={totals.entrada}
          icon={ArrowDownLeft}
          tone="emerald"
        />
        <SummaryCard
          label="Salidas de caja"
          value={totals.salida}
          icon={ArrowUpRight}
          tone="amber"
        />
        <SummaryCard
          label="Neto"
          value={totals.neto}
          icon={Wallet}
          tone={totals.neto >= 0 ? "emerald" : "rose"}
          hint="Entradas menos salidas y gastos"
        />
      </div>

      {/* Filtros */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-md border border-slate-200 p-0.5">
            {["todos", "gasto", "entrada", "salida"].map((k) => (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                className={`rounded px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  kindFilter === k
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {k === "todos" ? "Todos" : KIND_META[k].label}
              </button>
            ))}
          </div>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
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
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            aria-label="Filtrar por mes"
          >
            <option value="todos">Todos los meses</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
            ))}
          </select>

          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por concepto o nota…"
              className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando registros…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              No hay registros con esos filtros
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Cambia el periodo o agrega un registro nuevo.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Concepto</th>
                    <th className="px-4 py-3 text-right font-medium">Monto</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((e) => {
                    const meta = KIND_META[e.kind];
                    const Icon = meta.icon;
                    return (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {formatDate(e.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${meta.badge}`}
                          >
                            <Icon className="h-3 w-3" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-700">{e.concept}</div>
                          {e.notes && (
                            <div className="mt-0.5 text-xs text-slate-400">{e.notes}</div>
                          )}
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${meta.accent}`}
                        >
                          {currency(e.amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <button
                            onClick={() => openEdit(e)}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                            aria-label={`Editar ${e.concept}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(e)}
                            className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600"
                            aria-label={`Eliminar ${e.concept}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
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

      {/* Formulario */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form
            onSubmit={saveDraft}
            className="w-full max-w-md rounded-lg bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-800">
                {draft.id ? "Editar registro" : "Nuevo registro"}
              </h2>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tipo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(KIND_META).map(([k, meta]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, kind: k }))}
                      className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                        draft.kind === k
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Monto
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={draft.amount}
                    onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Concepto
                </label>
                <input
                  value={draft.concept}
                  onChange={(e) => setDraft((d) => ({ ...d, concept: e.target.value }))}
                  placeholder="Arriendo, servicios, transporte…"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nota <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <textarea
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                  rows={2}
                  className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmación de borrado */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h2 className="font-semibold text-slate-800">Eliminar registro</h2>
            <p className="mt-2 text-sm text-slate-600">
              Se va a borrar <strong>{confirmDelete.concept}</strong> del{" "}
              {formatDate(confirmDelete.date)} por{" "}
              {currency(confirmDelete.amount)}. No se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={doDelete}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => {
          const Icon =
            t.type === "success" ? CheckCircle2 : t.type === "error" ? XCircle : Info;
          const tone =
            t.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : t.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-slate-200 bg-white text-slate-700";
          return (
            <div
              key={t.id}
              className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm shadow-lg ${tone}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t.text}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-2 opacity-50 hover:opacity-100"
                aria-label="Cerrar aviso"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone, hint }) {
  const tones = {
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`rounded-md p-1.5 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums text-slate-800">
        {currency(value)}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
