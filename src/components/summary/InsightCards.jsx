import { AlertTriangle, Info, UserRound } from "lucide-react";
import { currency } from "@/utils/converts";
import WaitingForData from "./WaitingForData";

function InsightCard({ icon: Icon, iconBg, iconColor, title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-[18px] shadow-sm">
      <div className="mb-1 flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 flex-none items-center justify-center rounded-[9px] ${iconBg}`}
        >
          <Icon className={`h-[17px] w-[17px] ${iconColor}`} />
        </div>
        <div className="text-[15px] font-bold text-slate-900">{title}</div>
      </div>
      <div className="mb-3 text-[13px] text-slate-500">{subtitle}</div>
      {children}
    </div>
  );
}

function FiadoList({ rows }) {
  const total = rows.reduce((a, s) => a + s.total_amount, 0);
  return (
    <>
      <div className="mb-3 text-[26px] font-extrabold tabular-nums text-amber-800">
        {currency(total)}
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-2.5 rounded-[9px] bg-amber-50 px-3 py-2.5"
          >
            <div className="text-sm font-bold text-slate-900">
              {s.client_name || "Sin nombre"}
            </div>
            <div className="text-sm font-bold tabular-nums text-amber-800">
              {currency(s.total_amount)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Las tres alertas del período. Dos siguen esperando datos por producto, que el
// Excel nunca guardó; la de fiado sí se llena con las ventas registradas en la
// aplicación.
export default function InsightCards({ fiadoPendiente }) {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]">
      <InsightCard
        icon={AlertTriangle}
        iconBg="bg-amber-100"
        iconColor="text-amber-800"
        title="Se te van a acabar pronto"
        subtitle="Según lo que has vendido en este período"
      >
        <WaitingForData
          compact
          title="Esperando datos"
          detail="Necesita el inventario cargado y ventas por producto para calcular cuánto te dura cada cosa."
          cta="Cargar inventario"
          href="/products"
        />
      </InsightCard>

      <InsightCard
        icon={Info}
        iconBg="bg-slate-100"
        iconColor="text-slate-600"
        title="Plata quieta en la estantería"
        subtitle="Tienes stock pero nadie los compró en este período"
      >
        <WaitingForData
          compact
          title="Esperando datos"
          detail="Se calcula cruzando el stock con lo vendido. Hoy los 435 productos están en cero."
          cta="Cargar inventario"
          href="/products"
        />
      </InsightCard>

      <InsightCard
        icon={UserRound}
        iconBg="bg-amber-100"
        iconColor="text-amber-800"
        title="Fiado por cobrar"
        subtitle="Ventas a crédito que aún no te han pagado"
      >
        {fiadoPendiente.length > 0 ? (
          <FiadoList rows={fiadoPendiente} />
        ) : (
          <WaitingForData
            compact
            title="Esperando datos"
            detail="Aparece cuando registres una venta con método de pago «fiado» y el nombre del cliente."
            cta="Registrar una venta"
          />
        )}
      </InsightCard>
    </div>
  );
}
