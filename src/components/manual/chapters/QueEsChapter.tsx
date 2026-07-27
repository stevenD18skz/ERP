import { Store } from "lucide-react";
import { Callout, Section, Topic } from "../ManualPrimitives";

export default function QueEsChapter({ numero }: { numero: number }) {
  return (
    <Section
      id="que-es"
      icon={Store}
      numero={numero}
      titulo="Qué es este sistema"
      proposito="Qué problema resuelve, a quién le sirve y qué reemplaza del cuaderno y del Excel."
    >
      <p className="text-sm leading-relaxed text-slate-700">
        Boxes es el sistema de administración de la tienda: catálogo de
        productos, ventas, pedidos a proveedores, gastos y caja, y reportes del
        negocio. Reemplaza al cuaderno y a la hoja de cálculo que se usaban antes
        para llevar la cuenta del día.
      </p>

      <Topic titulo="Qué hace hoy y qué todavía no">
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Hace: catálogo con inventario, punto de venta, pedidos a proveedores
          que suman stock al recibirse, registro de gastos y movimientos de caja,
          y reportes con gráficas del período. Todavía no hace: facturación
          electrónica, tiquetes fiscales, usuarios y permisos por persona, ni
          lectura de código de barras con cámara. La sección{" "}
          <span className="font-medium text-slate-800">Configuración</span> del
          menú está reservada para más adelante; hoy no tiene nada que ajustar.
        </p>
      </Topic>

      <Topic titulo="De dónde salieron los datos que ya están cargados">
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          El sistema arrancó con el archivo de contabilidad que la tienda llevaba
          en 2025: 435 productos y 365 días de venta, ganancia, gasto y compra.
          El Excel solo guardaba un total por día, nunca venta por venta, así que
          ese detalle se va a ir llenando de aquí en adelante, a medida que se
          registre en la aplicación.
        </p>
      </Topic>

      <Callout tone="warning" title="Qué está firme y qué falta por confirmar">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Los precios de venta y el histórico día a día de 2025 son firmes: son
            los mismos números del Excel.
          </li>
          <li>
            El inventario arranca en cero porque el Excel nunca lo llevó: hay que
            contar el estante y cargar el stock real.
          </li>
          <li>
            398 productos tienen el costo calculado como precio × 0,81 (no de una
            factura). Se muestran marcados con{" "}
            <span className="font-mono">~</span> hasta que se confirmen a mano.
          </li>
          <li>
            Mientras el catálogo, las ventas, los pedidos y los gastos no estén
            conectados a una base de datos permanente, lo que se registre fuera
            del modo simulación queda guardado mientras la aplicación siga
            encendida, y se puede perder si se reinicia el servidor. El chip{" "}
            <span className="font-medium">Conectado</span> de la barra superior
            solo confirma que el inicio de sesión responde, no que el catálogo ya
            quedó guardado para siempre.
          </li>
        </ul>
      </Callout>
    </Section>
  );
}
