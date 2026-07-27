// Los cuatro indicadores del período, con su comparación contra el anterior.
// La flecha se dibuja a mano en SVG (tres líneas) en vez de traer tres iconos
// distintos solo para esto.
function DeltaChip({ d }) {
  const tone =
    d.dir === "up"
      ? "bg-emerald-50 text-emerald-700"
      : d.dir === "down"
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-600";
  return (
    <div
      className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}
    >
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

export default function KpiGrid({ kpis }) {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
        >
          <div className="text-[13px] font-bold text-slate-500">{k.label}</div>
          <div
            className={`mt-1.5 text-2xl font-extrabold tabular-nums ${k.valueClass}`}
          >
            {k.value}
          </div>
          <DeltaChip d={k.d} />
        </div>
      ))}
    </div>
  );
}
