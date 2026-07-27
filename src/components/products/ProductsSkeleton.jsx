"use client";

// Esqueleto de carga con la forma aproximada de la tabla, para que la pantalla
// no salte cuando llegan los datos. motion-reduce apaga el latido para quien
// pidió menos movimiento en el sistema operativo.
export default function ProductsSkeleton({ rows = 6 }) {
  return (
    <div className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5 py-1.5">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
            <div className="h-2.5 w-1/5 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
          </div>
          <div className="h-3 w-16 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}
