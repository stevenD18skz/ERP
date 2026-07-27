import { HelpCircle } from "lucide-react";
import { Faq } from "./ManualPrimitives";

// Lo que suele preguntarse cuando ya se conoce lo básico. Va al final y aparte
// de los capítulos: son dudas sueltas, no un tema con orden.
export default function ManualFaq() {
  return (
    <section id="faq" aria-labelledby="faq-h" className="mt-8 scroll-mt-20">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <HelpCircle className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <div>
          <h2 id="faq-h" className="text-lg font-semibold text-slate-900">
            Preguntas frecuentes
          </h2>
          <p className="text-sm text-slate-600">
            Lo que suele preguntarse cuando ya se conoce lo básico.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Faq q="¿Qué pasa si cierro la pestaña o se va la luz a mitad de una venta?">
          La venta no queda registrada y el stock no se descuenta: es como si no
          hubiera pasado. Solo se guarda cuando se hace clic en{" "}
          <span className="font-medium">Registrar venta</span>.
        </Faq>

        <Faq q="¿Los datos de la simulación pueden dañar la tienda real?">
          No. La simulación vive aparte, guardada en la pestaña del navegador;
          nunca lee ni escribe la información real de la tienda.
        </Faq>

        <Faq q="Me equivoqué en una venta que ya registré, ¿cómo la corrijo?">
          Se anula desde el historial de Ventas (el stock vendido se devuelve
          solo al inventario) y se vuelve a registrar bien. No hay forma de
          editar una venta ya confirmada.
        </Faq>

        <Faq q="¿Puedo recuperar un producto que borré por error?">
          Justo después de borrarlo aparece un aviso con la opción{" "}
          <span className="font-medium">Deshacer</span> durante unos segundos.
          Pasado ese tiempo, hay que volver a crearlo a mano.
        </Faq>

        <Faq q="¿Por qué el costo de un producto aparece con ~ y en gris?">
          Porque es un costo estimado (precio × 0,81), no uno tomado de una
          factura real. Se confirma editando el producto y escribiendo el costo a
          mano; la marca de estimado se quita sola.
        </Faq>

        <Faq q="¿Por qué algunas tablas de Reportes dicen 'Esperando datos'?">
          Porque necesitan ventas registradas producto por producto o con método
          de pago, y el histórico importado del Excel solo traía el total del
          día. Se van a ir llenando a medida que se use el punto de venta.
        </Faq>

        <Faq q="¿Cómo sé cuánto me deben los clientes que compraron fiado?">
          En <span className="font-medium">Reportes → Fiado por cobrar</span>,
          dentro del período que se esté mirando.
        </Faq>

        <Faq q="Intenté cerrar el mismo día dos veces y no me dejó, ¿por qué?">
          Solo puede existir un cierre por fecha. El aviso "Ya existe un cierre
          para esa fecha" significa que ese día ya quedó registrado; se revisa en
          el historial de Cierre del día en vez de crear otro.
        </Faq>

        <Faq q="¿Recibir un pedido y crearlo hacen lo mismo con el inventario?">
          No. Crear un pedido nunca mueve el inventario. Solo marcarlo como{" "}
          <span className="font-medium">Recibido</span> suma el stock de cada
          producto del pedido.
        </Faq>

        <Faq q="¿Para qué sirve la sección Configuración?">
          Todavía para nada: está reservada para más adelante y hoy no tiene
          ningún ajuste disponible.
        </Faq>

        <Faq q="¿Qué significa el chip 'Conectado' de la barra superior?">
          Confirma que el inicio de sesión (el servicio de autenticación) está
          respondiendo. No quiere decir que el catálogo, las ventas o los pedidos
          ya estén guardados en una base de datos permanente.
        </Faq>

        <Faq q="No sé algo que no está en este manual, ¿qué hago?">
          Se puede probar la duda directamente en el{" "}
          <a href="#primeros-pasos" className="text-blue-600 hover:underline">
            modo simulación
          </a>{" "}
          sin ningún riesgo, ya que no toca la tienda real.
        </Faq>
      </div>
    </section>
  );
}
