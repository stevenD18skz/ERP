import { ClipboardList } from "lucide-react";
import {
  Callout,
  FieldTable,
  Section,
  SimpleTable,
  Topic,
} from "../ManualPrimitives";

export default function PedidosChapter({ numero }: { numero: number }) {
  return (
    <Section
      id="pedidos"
      icon={ClipboardList}
      numero={numero}
      titulo="Pedidos a proveedores"
      proposito="Lo que se le encarga a cada proveedor y cuándo llega."
    >
      <Topic titulo="Crear un pedido">
        <FieldTable
          rows={[
            {
              campo: "Proveedor",
              obligatorio: true,
              notas: "Sugiere los proveedores ya usados antes.",
            },
            { campo: "Fecha de entrega esperada", obligatorio: true },
            { campo: "Notas", obligatorio: false },
          ]}
        />
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Después se buscan y agregan los productos con su cantidad y costo
          unitario (a diferencia de Ventas, aquí no hay tope de cantidad: se está
          pidiendo, no vendiendo). También se puede adjuntar la foto de la
          factura o el comprobante. Si el proveedor escrito coincide con uno
          anterior, aparece el botón{" "}
          <span className="font-medium">Repetir último pedido</span> para copiar
          esas mismas líneas.
        </p>
      </Topic>

      <Topic titulo="Cómo entra la mercancía al inventario">
        <SimpleTable
          head={["Estado", "Qué significa", "¿Mueve el inventario?"]}
          rows={[
            [
              "Pendiente",
              "El pedido se registró y se está esperando.",
              "No.",
            ],
            [
              "Recibido",
              "Se marca así cuando llega la mercancía, con el botón correspondiente en el historial.",
              "Sí: suma el stock de cada producto del pedido.",
            ],
            [
              "Cancelado",
              "El pedido no se va a completar.",
              "No: no afecta el inventario en ningún sentido.",
            ],
          ]}
        />
        <Callout tone="info" title="Un solo punto mueve stock">
          Crear el pedido nunca cambia el inventario. Solo marcarlo como{" "}
          <span className="font-medium">Recibido</span> suma el stock, y solo esa
          acción.
        </Callout>
      </Topic>

      <Topic titulo="Qué hacer cuando el proveedor no cumple">
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          El sistema marca solo, con la etiqueta{" "}
          <span className="font-medium text-amber-700">Entrega atrasada</span>,
          los pedidos pendientes cuya fecha de entrega ya pasó. Si el pedido ya
          no se va a recibir, se cancela desde el historial; esa acción tampoco
          se puede deshacer.
        </p>
      </Topic>
    </Section>
  );
}
