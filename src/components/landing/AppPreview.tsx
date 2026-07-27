import {
  BarChart3,
  Box,
  ClipboardList,
  LayoutDashboard,
  ShoppingCart,
  Wallet,
} from "lucide-react";

// Vista de ejemplo de la aplicación, dibujada con CSS en vez de una captura.
//
// Se hace así por dos razones: una captura real mostraría el movimiento de una
// tienda de verdad en una página abierta a internet, y además se ve borrosa en
// pantallas retina. Acá no aparece ninguna cifra de dinero a propósito: lo que
// se está mostrando es cómo se ve y se organiza la herramienta, no cuánto vende
// nadie.

const NAV = [
  { icon: LayoutDashboard, label: "Inicio", active: true },
  { icon: Box, label: "Productos" },
  { icon: ShoppingCart, label: "Ventas" },
  { icon: ClipboardList, label: "Pedidos" },
  { icon: Wallet, label: "Gastos" },
  { icon: BarChart3, label: "Reportes" },
];

// Alturas relativas de las barras, en porcentaje. Es una forma de curva
// creciente, no la medición de nada.
const BARS = [38, 52, 45, 63, 58, 76, 92];
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

const ROWS = [
  { name: "Arroz 1 kg", cat: "Granos", stock: 42, low: false },
  { name: "Aceite 500 ml", cat: "Despensa", stock: 8, low: true },
  { name: "Panela 500 g", cat: "Endulzantes", stock: 26, low: false },
  { name: "Café molido 250 g", cat: "Bebidas", stock: 5, low: true },
];

export default function AppPreview() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
      role="img"
      aria-label="Vista de ejemplo de Boxes: menú lateral con las secciones, indicadores del día, una gráfica de ventas por día de la semana y la tabla de productos con avisos de stock bajo."
    >
      {/* Barra del navegador */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 hidden rounded-md bg-white px-2.5 py-1 text-[10px] font-medium text-slate-400 ring-1 ring-slate-200 sm:block">
          boxes.app/dashboard
        </span>
      </div>

      <div className="flex" aria-hidden>
        {/* Menú lateral */}
        <div className="hidden w-36 shrink-0 flex-col gap-0.5 border-r border-slate-100 bg-slate-50/80 p-2.5 sm:flex">
          <div className="mb-2 flex items-center gap-1.5 px-1.5">
            <img
              src="/Boxes_logo.png"
              alt=""
              className="h-5 w-5 rounded object-cover"
            />
            <span className="text-[11px] font-bold text-slate-700">Boxes</span>
          </div>
          {NAV.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-1.5 rounded-md px-1.5 py-1.5 text-[10.5px] font-medium ${
                item.active
                  ? "bg-blue-600 text-white"
                  : "text-slate-500"
              }`}
            >
              <item.icon className="h-3 w-3 shrink-0" />
              {item.label}
            </div>
          ))}
        </div>

        {/* Contenido */}
        <div className="min-w-0 flex-1 space-y-2.5 bg-slate-50 p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold text-slate-800">
              Resumen de tu tienda
            </span>
            <span className="text-[9px] text-slate-400">Hoy</span>
          </div>

          {/* Indicadores */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Productos", value: "128", tone: "text-slate-800" },
              { label: "Stock bajo", value: "6", tone: "text-amber-600" },
              { label: "Margen", value: "24%", tone: "text-emerald-600" },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-lg bg-white p-2 ring-1 ring-slate-100"
              >
                <div className="text-[8.5px] font-medium text-slate-400">
                  {k.label}
                </div>
                <div
                  className={`mt-0.5 text-sm font-bold tabular-nums ${k.tone}`}
                >
                  {k.value}
                </div>
              </div>
            ))}
          </div>

          {/* Gráfica */}
          <div className="rounded-lg bg-white p-2.5 ring-1 ring-slate-100">
            <div className="text-[9px] font-semibold text-slate-500">
              Ventas por día
            </div>
            {/* Las barras y sus etiquetas van en dos filas separadas: si la
                etiqueta viviera dentro de la columna de la barra, el alto en
                porcentaje se mediría contra un contenedor sin alto propio y
                todas saldrían en cero. */}
            <div className="mt-2 flex h-14 items-end gap-1.5">
              {BARS.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-sm ${
                    i === BARS.length - 1 ? "bg-blue-600" : "bg-blue-200"
                  }`}
                />
              ))}
            </div>
            <div className="mt-1 flex gap-1.5">
              {DAYS.map((d, i) => (
                <span
                  key={i}
                  className="flex-1 text-center text-[7px] font-medium text-slate-400"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-100">
            {ROWS.map((r) => (
              <div
                key={r.name}
                className="flex items-center gap-2 border-b border-slate-50 px-2.5 py-1.5 last:border-0"
              >
                <div className="h-5 w-5 shrink-0 rounded bg-slate-100" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[9.5px] font-semibold text-slate-700">
                    {r.name}
                  </div>
                  <div className="text-[8px] text-slate-400">{r.cat}</div>
                </div>
                {r.low ? (
                  <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[7.5px] font-bold text-amber-800">
                    Stock bajo
                  </span>
                ) : null}
                <span className="w-6 shrink-0 text-right text-[9.5px] font-bold tabular-nums text-slate-600">
                  {r.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
