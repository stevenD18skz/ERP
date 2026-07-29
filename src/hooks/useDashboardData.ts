"use client";

import { useEffect, useMemo, useState } from "react";
import { localDateKey } from "@/utils/dates";
import { getProducts } from "@/services/products.service";
import { getSales } from "@/services/sales.service";
import { getOrders } from "@/services/orders.service";
import { getDailyCloses } from "@/services/dailyCloses.service";
import { getExpenses } from "@/services/expenses.service";
import type { Product } from "@/types/product";
import type { Sale } from "@/types/sale";
import type { Order } from "@/types/order";
import type { DailyClose } from "@/types/dailyClose";
import type { Expense } from "@/types/expense";
import {
  LOW_STOCK_THRESHOLD,
  buildActivity,
  pctDelta,
  type ActivityItem,
  type DayBreakdown,
} from "@/components/dashboard/dashboardUtils";

// Todo lo que Inicio necesita saber, en un solo lugar.
//
// Los datos se piden en el cliente y no se importan directo del mock: así esta
// pantalla también funciona con los datos de la simulación, que viven en la
// pestaña del navegador y el servidor no puede ver.
export function useDashboardData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dailyCloses, setDailyCloses] = useState<DailyClose[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, s, o, c, e] = await Promise.all([
        getProducts(),
        getSales(),
        getOrders(),
        getDailyCloses(),
        getExpenses(),
      ]);
      if (cancelled) return;
      setProducts(p);
      setSales(s);
      setOrders(o);
      setDailyCloses(c);
      setExpenses(e);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).length,
    [products],
  );

  // Inicio siempre habla de HOY, la fecha real del sistema. Si el día todavía
  // no tiene movimiento, cada tarjeta lo dice en vez de mostrar el último día
  // registrado como si fuera hoy. El histórico completo vive en /summary.
  const today = useMemo(() => {
    const byDate = new Map(dailyCloses.map((c) => [c.date, c]));
    const now = new Date();
    const dayAgo = (n: number) =>
      localDateKey(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() - n),
      );

    const todayIsoValue = dayAgo(0);
    const todayClose = byDate.get(todayIsoValue) ?? null;
    const yesterdayClose = byDate.get(dayAgo(1)) ?? null;

    // Si todavía no se cerró el día a mano, se arma con lo que ya se
    // registró venta por venta (cada venta ya trae su ganancia calculada) y
    // los gastos de hoy. Las compras a proveedores no tienen una fecha de
    // "recibido" que seguir, así que quedan en cero hasta que el día se
    // cierre con ese dato puesto a mano.
    let liveToday: {
      ventas: number;
      gain: number;
      gasto: number;
      compra: number;
    } | null = null;
    if (!todayClose) {
      const salesToday = sales.filter(
        (s) =>
          !s.voided && localDateKey(new Date(s.sale_date)) === todayIsoValue,
      );
      if (salesToday.length > 0) {
        const gastoHoy = expenses
          .filter((e) => e.kind === "gasto" && e.date === todayIsoValue)
          .reduce((sum, e) => sum + e.amount, 0);
        liveToday = {
          ventas: salesToday.reduce((sum, s) => sum + s.total_amount, 0),
          gain: salesToday.reduce((sum, s) => sum + s.gain, 0),
          gasto: gastoHoy,
          compra: 0,
        };
      }
    }

    const effectiveToday = todayClose
      ? {
          ventas: todayClose.sales_total,
          gain: todayClose.gain,
          gasto: todayClose.expenses_total,
          compra: todayClose.purchases_total,
        }
      : liveToday;

    // Promedio de los 7 días que terminan hoy, contando en cero los días sin
    // registro: si no se anotó nada, ese día no vendió nada que sepamos. El
    // día de hoy usa lo que ya se vendió aunque no se haya cerrado.
    const windowAvg = (offset: number) => {
      let sum = 0;
      for (let i = offset; i < offset + 7; i++) {
        const iso = dayAgo(i);
        sum +=
          byDate.get(iso)?.sales_total ??
          (iso === todayIsoValue ? (effectiveToday?.ventas ?? 0) : 0);
      }
      return sum / 7;
    };

    const ordered = [...dailyCloses].sort((a, b) =>
      b.date.localeCompare(a.date),
    );

    const breakdown: DayBreakdown | null = effectiveToday
      ? {
          date: todayIsoValue,
          ventas: effectiveToday.ventas,
          ganancia: effectiveToday.gain,
          gasto: effectiveToday.gasto,
          compra: effectiveToday.compra,
          costo: effectiveToday.ventas - effectiveToday.gain,
          neto: effectiveToday.gain - effectiveToday.gasto,
        }
      : null;

    // Sin cierre manual pero con ventas ya registradas: se agrega una fila
    // "Hoy" armada con esas ventas para que la tabla no se vea vacía mientras
    // el resto de Inicio ya está contando ese movimiento.
    const recentClosesBase = todayClose
      ? ordered
      : liveToday
        ? [
            {
              id: "live-today",
              date: todayIsoValue,
              sales_total: liveToday.ventas,
              gain: liveToday.gain,
              expenses_total: liveToday.gasto,
              purchases_total: liveToday.compra,
              cash_in: null,
              cash_out: null,
              source: "app" as const,
            },
            ...ordered,
          ]
        : ordered;

    return {
      hasToday: !!effectiveToday,
      ventasHoy: effectiveToday?.ventas ?? 0,
      ventasDelta: pctDelta(
        effectiveToday?.ventas ?? 0,
        yesterdayClose?.sales_total ?? 0,
      ),
      gananciaHoy: effectiveToday?.gain ?? 0,
      gananciaDelta: pctDelta(
        effectiveToday?.gain ?? 0,
        yesterdayClose?.gain ?? 0,
      ),
      promedioSemana: windowAvg(0),
      tendenciaPct: pctDelta(windowAvg(0), windowAvg(7)),
      dayBreakdown: breakdown,
      lastRecorded: ordered[0] ?? null,
      recentCloses: recentClosesBase.slice(0, 7),
      todayIso: todayIsoValue,
    };
  }, [dailyCloses, sales, expenses]);

  const topProductsHome = useMemo(
    () =>
      products
        .slice()
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 5),
    [products],
  );

  const activity: ActivityItem[] = useMemo(
    () => buildActivity(products, sales, orders),
    [products, sales, orders],
  );

  return { ...today, lowStockCount, topProductsHome, activity, loading };
}

export default useDashboardData;
