"use client";

import { RANGE_PRESETS } from "./summaryUtils";

// Selector de período. Los presets se calculan desde el último día con datos,
// no desde hoy; quien lo llama se encarga de avisarlo cuando no coinciden.
export default function RangePicker({
  rangeKey,
  onRangeKeyChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  rangeError,
}) {
  return (
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
              onClick={() => onRangeKeyChange(r.key)}
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
            <span className="mb-1.5 block text-[13px] font-bold text-slate-900">
              Desde
            </span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className="h-11 rounded-[10px] border border-slate-200 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-slate-900">
              Hasta
            </span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
              className="h-11 rounded-[10px] border border-slate-200 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          {rangeError && (
            <div className="pb-3 text-[12.5px] font-semibold text-red-600">
              {rangeError}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
