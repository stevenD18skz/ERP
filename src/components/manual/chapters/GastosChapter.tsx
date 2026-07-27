import { Wallet } from "lucide-react";
import {
  Callout,
  FieldTable,
  Section,
  SimpleTable,
  Topic,
} from "../ManualPrimitives";

export default function GastosChapter({ numero }: { numero: number }) {
  return (
    <Section
      id="gastos"
      icon={Wallet}
      numero={numero}
      titulo="Gastos y caja"
      proposito="A dónde se va la plata que no es mercancía."
    >
      <Topic titulo="Los tres tipos de registro">
        <SimpleTable
          head={["Tipo", "Para qué es"]}
          rows={[
            [
              "Gasto",
              "Un gasto del negocio: servicios, arriendo, insumos, lo que sea.",
            ],
            [
              "Entrada de caja",
              "Plata que entra a la caja por fuera de una venta registrada.",
            ],
            [
              "Salida de caja",
              "Plata que sale de la caja por fuera de un gasto ya clasificado.",
            ],
          ]}
        />
      </Topic>

      <Topic titulo="Registrar uno">
        <FieldTable
          rows={[
            { campo: "Tipo", obligatorio: true },
            { campo: "Fecha", obligatorio: true },
            {
              campo: "Monto",
              obligatorio: true,
              notas: "Debe ser mayor que cero.",
            },
            {
              campo: "Concepto",
              obligatorio: true,
              notas:
                'Escribir algo que se reconozca después, no solo "gasto".',
            },
            { campo: "Nota", obligatorio: false },
          ]}
        />
      </Topic>

      <Topic titulo="Revisar un período">
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Se filtra por tipo, año, mes o por texto libre sobre el concepto.
          Arriba de la tabla quedan los totales de gastos, entradas y salidas, y
          el neto del período (entradas menos salidas menos gastos), en rojo
          cuando da negativo.
        </p>
      </Topic>

      <Callout
        tone="info"
        title="Por qué algunos registros de 2025 no tienen detalle"
      >
        Los del Excel solo traían un total de gasto por día, sin decir en qué se
        fue; por eso aparecen sin concepto detallado. Las entradas y salidas de
        caja de ese año solo se llevaron de enero a abril.
      </Callout>
    </Section>
  );
}
