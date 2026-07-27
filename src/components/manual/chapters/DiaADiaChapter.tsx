import { CalendarCheck } from "lucide-react";
import { Section, Steps } from "../ManualPrimitives";

export default function DiaADiaChapter({ numero }: { numero: number }) {
  return (
    <Section
      id="dia-a-dia"
      icon={CalendarCheck}
      numero={numero}
      titulo="El día a día"
      proposito="La rutina completa, de abrir a cerrar."
    >
      <Steps
        items={[
          <>
            <span className="font-medium">Al abrir:</span> revisar Inicio para
            ver el stock bajo y lo pendiente del día anterior (pedidos
            atrasados, fiados sin cobrar).
          </>,
          <>
            <span className="font-medium">Durante el día:</span> registrar cada
            venta en{" "}
            <span className="font-medium">Ventas → Venta por venta</span> y
            anotar los gastos o movimientos de caja en{" "}
            <span className="font-medium">Gastos y caja</span> a medida que
            ocurren.
          </>,
          <>
            <span className="font-medium">Al cerrar:</span> si se registró venta
            por venta durante el día, no hace falta nada más; si no se alcanzó,
            dejar el total en{" "}
            <span className="font-medium">Ventas → Cierre del día</span>.
          </>,
          <>
            <span className="font-medium">Una vez por semana:</span> revisar los
            pedidos pendientes y atrasados, y aprovechar para confirmar algún
            costo que siga marcado como estimado.
          </>,
        ]}
      />
    </Section>
  );
}
