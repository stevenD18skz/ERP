"use client";

import { Search } from "lucide-react";
import WaitingForData from "./WaitingForData";

// Rendimiento por producto. El buscador queda deshabilitado a propósito: sin
// ventas registradas producto por producto no hay nada que buscar, y un campo
// que se puede escribir pero no devuelve nada se lee como una falla.
export default function ProductPerformance({ search, onSearchChange }) {
  return (
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
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
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
  );
}
