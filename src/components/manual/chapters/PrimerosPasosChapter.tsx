import { Compass } from "lucide-react";
import { Section, Topic } from "../ManualPrimitives";

export default function PrimerosPasosChapter({ numero }: { numero: number }) {
  return (
    <Section
      id="primeros-pasos"
      icon={Compass}
      numero={numero}
      titulo="Primeros pasos"
      proposito="Cómo moverse por la aplicación sin perderse."
    >
      <Topic titulo="Las partes de la pantalla">
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
          <li>
            <span className="font-medium text-slate-800">Barra de arriba:</span>{" "}
            el logo lleva a Inicio, el buscador, y a la derecha los chips de
            estado (simulación y conexión), las notificaciones y el menú de
            usuario.
          </li>
          <li>
            <span className="font-medium text-slate-800">
              Menú de la izquierda:
            </span>{" "}
            Inicio, Productos, Ventas, Pedidos, Gastos y caja, Reportes, Manual y
            Configuración. Se puede colapsar con el botón de la barra de arriba
            para dejar más espacio. Al fondo del menú están los botones para
            reiniciar la simulación (cuando está encendida) y para salir.
          </li>
        </ul>
      </Topic>

      <Topic titulo="Qué muestra Inicio">
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Un resumen del día: ventas y ganancia de hoy, promedio de los últimos 7
          días, productos con stock bajo, en qué se repartió la plata del día,
          accesos rápidos a las tareas más comunes, los últimos cierres diarios y
          la actividad reciente.
        </p>
      </Topic>

      <Topic titulo="Practicar con el modo simulación">
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Desde la página de inicio (fuera de sesión) o entrando directamente a{" "}
          <span className="font-mono">/simulacion</span>, se abre la aplicación
          completa con una tienda inventada: productos, ventas, pedidos y cierres
          de ejemplo. Los cambios se guardan mientras esa pestaña del navegador
          siga abierta y desaparecen solos al cerrarla; también se puede
          reiniciar a los datos originales o salir en cualquier momento desde el
          menú de la izquierda. Nada de lo que pase ahí toca la información real
          de la tienda.
        </p>
      </Topic>

      <Topic titulo="Cómo saber si se está viendo la tienda real o una prueba">
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Si en la barra de arriba aparece el chip ámbar{" "}
          <span className="font-medium">Modo simulación</span>, lo que se ve son
          datos de prueba. Si ese chip no está, es la tienda de verdad.
        </p>
      </Topic>
    </Section>
  );
}
