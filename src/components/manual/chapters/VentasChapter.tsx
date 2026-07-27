import { ShoppingCart } from "lucide-react";
import {
  Callout,
  FieldTable,
  Section,
  SimpleTable,
  Steps,
  Topic,
} from "../ManualPrimitives";

export default function VentasChapter({ numero }: { numero: number }) {
  return (
    <Section
      id="ventas"
      icon={ShoppingCart}
      numero={numero}
      titulo="Ventas"
      proposito="Registrar lo que se vende, venta por venta o el total del día."
    >
      <Callout tone="info" title="Dos formas de registrar, un mismo lugar">
        Arriba del todo hay un selector para cambiar entre{" "}
        <span className="font-medium">Venta por venta</span> y{" "}
        <span className="font-medium">Cierre del día</span>. La primera es el
        punto de venta normal; la segunda sirve para los días en que no se
        alcanzó a registrar cada venta y solo se quiere dejar el total, como se
        hacía en el Excel.
      </Callout>

      <Topic titulo="Armar una venta">
        <Steps
          items={[
            "Buscar el producto por nombre, SKU o código de barras y elegirlo de las sugerencias (con las flechas y Enter, o con el mouse). Un producto sin stock aparece deshabilitado y no se puede agregar.",
            "Ajustar la cantidad de cada línea con los +/− o escribiéndola directamente; no puede superar el stock disponible.",
            <>
              Si hace falta, poner un descuento por línea con el botón de
              descuento: por porcentaje o por un monto fijo (el monto nunca puede
              ser mayor que el valor de esa línea).
            </>,
            "Elegir la forma de pago y completar lo que pida.",
            <>
              Botón <span className="font-medium">Registrar venta</span>. Se
              descuenta el stock vendido y se abre un recibo que se puede
              imprimir.
            </>,
          ]}
        />
      </Topic>

      <Topic titulo="Formas de pago">
        <SimpleTable
          head={["Forma de pago", "Qué pide", "Qué pasa"]}
          rows={[
            [
              "Efectivo",
              "Monto recibido",
              'Calcula el vuelto. Hay botones de montos rápidos (+$5.000, +$10.000, +$20.000, +$50.000) y "Monto exacto". Si el monto no alcanza, se marca en rojo cuánto falta por cobrar.',
            ],
            [
              "Tarjeta",
              "Solo confirmar",
              "Aviso para confirmar cuando el pago se acredite en el datáfono. No hay conexión real con una pasarela ni con el datáfono.",
            ],
            [
              "Transferencia",
              "Solo confirmar",
              "Aviso para confirmar cuando se vea la transferencia (Nequi, Daviplata u otra) en la cuenta.",
            ],
            [
              "Fiado",
              "Nombre del cliente",
              'Queda pendiente de cobro a nombre de esa persona. Aparece después en Reportes → "Fiado por cobrar".',
            ],
          ]}
        />
      </Topic>

      <Topic titulo="Anular una venta">
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Desde el historial de ventas, con el botón de anular sobre la venta ya
          registrada. Pide confirmación porque no se puede deshacer: la venta
          queda marcada como anulada (tachada, con la etiqueta correspondiente) y
          el stock vendido se devuelve al inventario. No se usa para corregir un
          error menor de una venta que sigue en pie: para eso conviene anularla y
          volver a registrarla bien.
        </p>
      </Topic>

      <Topic titulo="Cierre del día: cuándo usarlo en vez de venta por venta">
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Cuando no se alcanzó a registrar cada venta y solo se quiere dejar el
          total del día, igual que en el Excel.
        </p>
        <FieldTable
          rows={[
            { campo: "Fecha", obligatorio: true },
            {
              campo: "Venta del día",
              obligatorio: true,
              notas: "Debe ser mayor que cero.",
            },
            {
              campo: "Ganancia",
              obligatorio: false,
              notas:
                "Se calcula sola al 19% de la venta; se puede corregir a mano.",
            },
            { campo: "Gasto", obligatorio: false },
            { campo: "Compra", obligatorio: false },
            { campo: "Entrada de caja", obligatorio: false },
            { campo: "Salida de caja", obligatorio: false },
          ]}
        />
        <Callout tone="warning" title="Solo un cierre por fecha">
          El sistema no deja crear dos cierres para el mismo día: si ya existe
          uno, avisa{" "}
          <span className="font-mono">Ya existe un cierre para esa fecha</span>.
          El historial de la sección, con filtros por año y mes, sirve para
          revisar el que ya quedó registrado.
        </Callout>
      </Topic>
    </Section>
  );
}
