"use client";

import { useMemo } from "react";
import {
  ShoppingCart,
  PackagePlus,
  ClipboardList,
  BarChart3,
  Wallet,
  CalendarClock,
  PiggyBank,
} from "lucide-react";

import { currency } from "@/utils/converts";
import { useDashboardData } from "@/hooks/useDashboardData";
import DayMoneyDonut from "@/components/dashboard/DayMoneyDonut";
import LowStockCard from "@/components/dashboard/LowStockCard";
import QuickAction from "@/components/dashboard/QuickAction";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RecentCloses from "@/components/dashboard/RecentCloses";
import TopProductsHome from "@/components/dashboard/TopProductsHome";
import TrendCard from "@/components/dashboard/TrendCard";
import { getGreeting, sentenceCase } from "@/components/dashboard/dashboardUtils";
import { useSession } from "@/hooks/useSession";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

// Pantalla de Inicio: el resumen del día. Los datos y los cálculos viven en
// useDashboardData; acá solo se decide qué bloque va dónde.
export default function Home() {
    const { tienda, logout } = useSession();


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
    lowStockCount,
    topProductsHome,
    activity,
    loading,
  } = useDashboardData();

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
    <>
      {/* Saludo */}
      <header className="flex flex-wrap items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">{getGreeting()}</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
            Resumen de <span className="text-blue-600">{tienda?.nombre}</span>
          </h2>
        </div>

        <p className="text-sm text-slate-500">{today}</p>
      </header>

      <main className="mt-4 space-y-4">
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
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
              <LowStockCard count={lowStockCount} />
            </section>

            {/* Reparto del día + accesos rápidos */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <section
                aria-label="Reparto de la plata del día"
                className="lg:col-span-2"
              >
                <h2 className="sr-only">Reparto de la plata del día</h2>
                <DayMoneyDonut day={dayBreakdown} lastRecorded={lastRecorded} />
              </section>

              <section aria-label="Acciones rápidas" className="flex flex-col gap-4">
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
            <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RecentCloses items={recentCloses} todayIso={todayIso} />
              </div>
              <div className="space-y-6">
                <RecentActivity items={activity} />
                <TopProductsHome items={topProductsHome} />
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
