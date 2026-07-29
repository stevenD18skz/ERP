import {
  ShoppingCart,
  PackagePlus,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import QuickAction from "./QuickAction";

// Esqueleto de Inicio: mismo grid que el contenido real para que no haya
// salto de layout entre el placeholder y los datos ya cargados. Las
// Acciones rápidas no dependen de datos, así que se muestran reales desde
// el primer render.
function Pulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-100 motion-reduce:animate-none ${className}`}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-2">
        <Pulse className="h-3 w-24" />
        <Pulse className="h-9 w-9 shrink-0 rounded-lg" />
      </div>
      <Pulse className="mt-3 h-6 w-28" />
      <Pulse className="mt-3 h-4 w-16 rounded-full" />
    </div>
  );
}

function ListCardSkeleton({ title, rows }: { title: string; rows: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <Pulse className="h-4 w-32" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Pulse key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <>
      {/* Indicadores del día */}
      <section
        aria-label="Indicadores clave"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </section>

      {/* Reparto del día + accesos rápidos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section
          aria-label="Reparto de la plata del día"
          className="lg:col-span-2"
        >
          <div className="flex h-full flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:p-6">
            <Pulse className="h-4 w-56" />
            <div className="mt-6 flex flex-col items-center gap-7 md:flex-row md:items-start md:gap-9">
              <Pulse className="h-[188px] w-[188px] shrink-0 rounded-full" />
              <div className="w-full min-w-0 flex-1 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between gap-3">
                      <Pulse className="h-3.5 w-40" />
                      <Pulse className="h-3.5 w-16" />
                    </div>
                    <Pulse className="mt-2 h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Acciones rápidas" className="flex flex-col gap-4">
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
      <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ListCardSkeleton title="Últimos cierres diarios" rows={5} />
        </div>
        <div className="space-y-6">
          <ListCardSkeleton title="Actividad reciente" rows={3} />
          <ListCardSkeleton title="Más stock" rows={3} />
        </div>
      </section>
    </>
  );
}
