import WaitingForData from "./WaitingForData";

// Corte por medio de pago. Empieza vacío porque el Excel no lo registraba: se
// va llenando desde la primera venta hecha en la aplicación.
export default function PaymentMethods() {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-[18px] shadow-sm">
      <div className="text-base font-bold text-slate-900">
        ¿Cómo te pagaron?
      </div>
      <div className="mb-4 mt-0.5 text-[13px] text-slate-500">
        Útil para saber cuánta plata entró en efectivo a la caja
      </div>
      <WaitingForData
        title="Esperando datos para mostrar esta gráfica"
        detail="El método de pago se guarda en cada venta. El Excel no lo registraba, así que este corte empieza desde la primera venta que hagas en la aplicación."
        cta="Registrar una venta"
      />
    </section>
  );
}
