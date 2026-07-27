// Manual de usuario.
//
// Pensado para alguien que atiende la tienda y no sabe (o se le olvidó) cómo
// se hace algo puntual: se entra por el índice o por la pregunta frecuente
// que más se le parezca, no se lee de corrido. Todo lo que dice este manual
// describe lo que la aplicación hace hoy, no lo que se planea hacer.

import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Store,
  Compass,
  Box,
  ShoppingCart,
  ClipboardList,
  Wallet,
  BarChart3,
  CalendarCheck,
  HelpCircle,
  Type,
  FlaskConical,
  ArrowRight,
  Info,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

export const metadata = {
  title: "Manual de usuario · Boxes",
  description:
    "Para qué sirve cada sección de Boxes y cómo se hace cada tarea del día a día, con preguntas frecuentes al final.",
};

// ---------------------------------------------------------------- ayudas ---

type Capitulo = { icon: LucideIcon; id: string; titulo: string };

const CAPITULOS: Capitulo[] = [
  { icon: Store, id: "que-es", titulo: "Qué es este sistema" },
  { icon: Compass, id: "primeros-pasos", titulo: "Primeros pasos" },
  { icon: Box, id: "productos", titulo: "Productos" },
  { icon: ShoppingCart, id: "ventas", titulo: "Ventas" },
  { icon: ClipboardList, id: "pedidos", titulo: "Pedidos a proveedores" },
  { icon: Wallet, id: "gastos", titulo: "Gastos y caja" },
  { icon: BarChart3, id: "reportes", titulo: "Reportes" },
  { icon: CalendarCheck, id: "dia-a-dia", titulo: "El día a día" },
  { icon: HelpCircle, id: "problemas", titulo: "Problemas comunes" },
  { icon: Type, id: "glosario", titulo: "Palabras del sistema" },
];

function Callout({
  tone,
  title,
  children,
}: {
  tone: "info" | "warning" | "tip";
  title: string;
  children: ReactNode;
}) {
  const styles = {
    info: {
      wrap: "border-blue-200 bg-blue-50",
      title: "text-blue-900",
      body: "text-blue-800",
      Icon: Info,
    },
    warning: {
      wrap: "border-amber-200 bg-amber-50",
      title: "text-amber-900",
      body: "text-amber-800",
      Icon: AlertTriangle,
    },
    tip: {
      wrap: "border-teal-200 bg-teal-50/60",
      title: "text-teal-900",
      body: "text-teal-800",
      Icon: Lightbulb,
    },
  }[tone];

  return (
    <div className={`rounded-xl border p-5 ${styles.wrap}`}>
      <h3
        className={`flex items-center gap-2 text-sm font-semibold ${styles.title}`}
      >
        <styles.Icon className="h-4 w-4 shrink-0" aria-hidden />
        {title}
      </h3>
      <div className={`mt-2 text-sm leading-relaxed ${styles.body}`}>
        {children}
      </div>
    </div>
  );
}

function FieldTable({
  rows,
}: {
  rows: { campo: string; obligatorio: boolean; notas?: string }[];
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">Campo</th>
            <th className="px-4 py-2 font-medium">¿Obligatorio?</th>
            <th className="px-4 py-2 font-medium">Notas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.campo}>
              <td className="px-4 py-2.5 font-medium text-slate-800">
                {r.campo}
              </td>
              <td className="px-4 py-2.5">
                {r.obligatorio ? (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[12px] font-medium text-red-600">
                    Sí
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-slate-500">
                    No
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-slate-600">{r.notas ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimpleTable({
  head,
  rows,
}: {
  head: string[];
  rows: string[][];
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-2.5 align-top ${j === 0 ? "font-medium text-slate-800" : "text-slate-600"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="mt-4 space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
            {i + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Section({
  id,
  icon: Icon,
  numero,
  titulo,
  proposito,
  children,
}: {
  id: string;
  icon: LucideIcon;
  numero: number;
  titulo: string;
  proposito: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
          aria-hidden
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id={`${id}-h`}
            className="text-lg font-semibold text-slate-900"
          >
            <span className="tabular-nums text-slate-400">
              {String(numero).padStart(2, "0")}.
            </span>{" "}
            {titulo}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {proposito}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-5 pl-0 sm:pl-[52px]">{children}</div>
    </section>
  );
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="group rounded-lg border border-slate-200 bg-white open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-slate-800 marker:content-none">
        {q}
        <span
          className="shrink-0 text-slate-400 transition-transform group-open:rotate-45"
          aria-hidden
        >
          +
        </span>
      </summary>
      <div className="border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------- página ---

export default function ManualPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
            <BookOpen className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Manual de usuario
            </h1>
            <p className="text-sm text-slate-500">
              Para qué sirve cada parte y cómo se usa. Si no sabes por dónde
              empezar, busca tu pregunta en el índice o en las preguntas
              frecuentes al final.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50/60 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-teal-900">
            <FlaskConical className="h-4 w-4" aria-hidden />
            Se puede practicar mientras se lee
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-teal-800">
            El modo simulación abre la aplicación completa con una tienda
            inventada, para probar cualquier cosa de este manual sin miedo a
            dañar la información real.
          </p>
          <Link
            href="/simulacion"
            className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            Abrir la simulación
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </header>

      {/* -------------------------------------------------------- índice --- */}
      <nav aria-labelledby="indice" className="mt-8">
        <h2 id="indice" className="text-lg font-semibold text-slate-900">
          Índice
        </h2>
        <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CAPITULOS.map((c, i) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className="tabular-nums text-slate-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <c.icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                {c.titulo}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#faq"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span className="tabular-nums text-slate-400">11</span>
              <HelpCircle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              Preguntas frecuentes
            </a>
          </li>
        </ol>
      </nav>

      {/* ------------------------------------------------------ capítulos --- */}
      <div className="mt-8 space-y-6">
        <Section
          id="que-es"
          icon={Store}
          numero={1}
          titulo="Qué es este sistema"
          proposito="Qué problema resuelve, a quién le sirve y qué reemplaza del cuaderno y del Excel."
        >
          <p className="text-sm leading-relaxed text-slate-700">
            Boxes es el sistema de administración de la tienda: catálogo de
            productos, ventas, pedidos a proveedores, gastos y caja, y
            reportes del negocio. Reemplaza al cuaderno y a la hoja de cálculo
            que se usaban antes para llevar la cuenta del día.
          </p>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Qué hace hoy y qué todavía no
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Hace: catálogo con inventario, punto de venta, pedidos a
              proveedores que suman stock al recibirse, registro de gastos y
              movimientos de caja, y reportes con gráficas del período.
              Todavía no hace: facturación electrónica, tiquetes fiscales,
              usuarios y permisos por persona, ni lectura de código de barras
              con cámara. La sección{" "}
              <span className="font-medium text-slate-800">Configuración</span>{" "}
              del menú está reservada para más adelante; hoy no tiene nada
              que ajustar.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              De dónde salieron los datos que ya están cargados
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              El sistema arrancó con el archivo de contabilidad que la tienda
              llevaba en 2025: 435 productos y 365 días de venta, ganancia,
              gasto y compra. El Excel solo guardaba un total por día, nunca
              venta por venta, así que ese detalle se va a ir llenando de aquí
              en adelante, a medida que se registre en la aplicación.
            </p>
          </div>

          <Callout tone="warning" title="Qué está firme y qué falta por confirmar">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Los precios de venta y el histórico día a día de 2025 son
                firmes: son los mismos números del Excel.
              </li>
              <li>
                El inventario arranca en cero porque el Excel nunca lo llevó:
                hay que contar el estante y cargar el stock real.
              </li>
              <li>
                398 productos tienen el costo calculado como precio × 0,81
                (no de una factura). Se muestran marcados con{" "}
                <span className="font-mono">~</span> hasta que se confirmen a
                mano.
              </li>
              <li>
                Mientras el catálogo, las ventas, los pedidos y los gastos no
                estén conectados a una base de datos permanente, lo que se
                registre fuera del modo simulación queda guardado mientras la
                aplicación siga encendida, y se puede perder si se reinicia el
                servidor. El chip <span className="font-medium">Conectado</span>{" "}
                de la barra superior solo confirma que el inicio de sesión
                responde, no que el catálogo ya quedó guardado para siempre.
              </li>
            </ul>
          </Callout>
        </Section>

        <Section
          id="primeros-pasos"
          icon={Compass}
          numero={2}
          titulo="Primeros pasos"
          proposito="Cómo moverse por la aplicación sin perderse."
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Las partes de la pantalla
            </h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
              <li>
                <span className="font-medium text-slate-800">
                  Barra de arriba:
                </span>{" "}
                el logo lleva a Inicio, el buscador, y a la derecha los chips
                de estado (simulación y conexión), las notificaciones y el
                menú de usuario.
              </li>
              <li>
                <span className="font-medium text-slate-800">
                  Menú de la izquierda:
                </span>{" "}
                Inicio, Productos, Ventas, Pedidos, Gastos y caja, Reportes,
                Manual y Configuración. Se puede colapsar con el botón de la
                barra de arriba para dejar más espacio. Al fondo del menú
                están los botones para reiniciar la simulación (cuando está
                encendida) y para salir.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Qué muestra Inicio
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Un resumen del día: ventas y ganancia de hoy, promedio de los
              últimos 7 días, productos con stock bajo, en qué se repartió la
              plata del día, accesos rápidos a las tareas más comunes, los
              últimos cierres diarios y la actividad reciente.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Practicar con el modo simulación
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Desde la página de inicio (fuera de sesión) o entrando
              directamente a <span className="font-mono">/simulacion</span>,
              se abre la aplicación completa con una tienda inventada:
              productos, ventas, pedidos y cierres de ejemplo. Los cambios se
              guardan mientras esa pestaña del navegador siga abierta y
              desaparecen solos al cerrarla; también se puede reiniciar a los
              datos originales o salir en cualquier momento desde el menú de
              la izquierda. Nada de lo que pase ahí toca la información real
              de la tienda.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Cómo saber si se está viendo la tienda real o una prueba
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Si en la barra de arriba aparece el chip ámbar{" "}
              <span className="font-medium">Modo simulación</span>, lo que se
              ve son datos de prueba. Si ese chip no está, es la tienda de
              verdad.
            </p>
          </div>
        </Section>

        <Section
          id="productos"
          icon={Box}
          numero={3}
          titulo="Productos"
          proposito="Mantener el catálogo al día: qué se vende, a cuánto y cuánto queda."
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Crear o editar un producto
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Botón <span className="font-medium">Nuevo producto</span> arriba
              a la derecha, o el lápiz sobre una fila para editar uno que ya
              existe.
            </p>
            <FieldTable
              rows={[
                { campo: "Nombre", obligatorio: true },
                {
                  campo: "SKU",
                  obligatorio: true,
                  notas: "Código interno del producto.",
                },
                { campo: "Código de barras", obligatorio: false },
                {
                  campo: "Categoría",
                  obligatorio: false,
                  notas: "Sugiere las categorías que ya existen mientras se escribe.",
                },
                {
                  campo: "Costo",
                  obligatorio: true,
                  notas:
                    "Si se escribe a mano, deja de estar marcado como estimado.",
                },
                { campo: "Precio de venta", obligatorio: true },
                { campo: "Stock inicial", obligatorio: true },
                { campo: "Foto", obligatorio: false },
                { campo: "Descripción", obligatorio: false },
              ]}
            />
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Mientras se escribe el costo y el precio, el formulario muestra
              la ganancia por unidad y el margen sobre el precio de venta.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Costo estimado
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Los productos importados del Excel sin factura tienen el costo
              calculado como precio × 0,81 (el margen del 19% que usaba esa
              contabilidad). Se muestran con{" "}
              <span className="font-mono">~</span> y en gris. Para
              confirmarlo, se edita el producto y se escribe el costo real: la
              marca de estimado se quita sola.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Inventario y stock
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Cada fila tiene un control de stock con +/− o edición directa
              del número; el cambio se guarda solo. Un producto con 10
              unidades o menos se marca{" "}
              <span className="font-medium text-amber-700">Stock bajo</span>;
              con 0, se marca{" "}
              <span className="font-medium text-red-600">Agotado</span>.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Buscar, filtrar y ordenar
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              El buscador de arriba mira nombre, SKU, código de barras y
              descripción. El botón{" "}
              <span className="font-medium">Filtros</span> abre un panel para
              acotar por rango de precio, por stock (cualquiera, menor que,
              mayor que o igual a un valor) y por categoría. Haciendo clic en
              el encabezado de una columna se ordena la tabla por ese campo.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Cargar varios productos a la vez (importar)
            </h3>
            <Steps
              items={[
                <>
                  Botón <span className="font-medium">Importar</span>. Si hace
                  falta un punto de partida, se puede descargar la plantilla
                  de ejemplo desde el mismo cuadro.
                </>,
                "Arrastrar o elegir el archivo CSV. El sistema revisa cada fila y avisa cuáles están listas y cuáles tienen errores (nombre, SKU, precio, costo o stock inválidos).",
                "Confirmar: las filas con errores no se importan; se pueden corregir en el archivo y volver a intentar.",
              ]}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Eliminar, exportar e imprimir
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Borrar un producto pide confirmación y da unos segundos para
              deshacerlo con el botón que aparece en el aviso. Con las casillas
              de la izquierda se pueden seleccionar varios y borrarlos juntos.
              Los botones <span className="font-medium">Exportar</span> e{" "}
              <span className="font-medium">Imprimir</span> trabajan sobre lo
              que esté filtrado en pantalla en ese momento.
            </p>
          </div>
        </Section>

        <Section
          id="ventas"
          icon={ShoppingCart}
          numero={4}
          titulo="Ventas"
          proposito="Registrar lo que se vende, venta por venta o el total del día."
        >
          <Callout tone="info" title="Dos formas de registrar, un mismo lugar">
            Arriba del todo hay un selector para cambiar entre{" "}
            <span className="font-medium">Venta por venta</span> y{" "}
            <span className="font-medium">Cierre del día</span>. La primera es
            el punto de venta normal; la segunda sirve para los días en que no
            se alcanzó a registrar cada venta y solo se quiere dejar el total,
            como se hacía en el Excel.
          </Callout>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Armar una venta
            </h3>
            <Steps
              items={[
                "Buscar el producto por nombre, SKU o código de barras y elegirlo de las sugerencias (con las flechas y Enter, o con el mouse). Un producto sin stock aparece deshabilitado y no se puede agregar.",
                "Ajustar la cantidad de cada línea con los +/− o escribiéndola directamente; no puede superar el stock disponible.",
                <>
                  Si hace falta, poner un descuento por línea con el botón de
                  descuento: por porcentaje o por un monto fijo (el monto
                  nunca puede ser mayor que el valor de esa línea).
                </>,
                "Elegir la forma de pago y completar lo que pida.",
                <>
                  Botón <span className="font-medium">Registrar venta</span>.
                  Se descuenta el stock vendido y se abre un recibo que se
                  puede imprimir.
                </>,
              ]}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Formas de pago
            </h3>
            <SimpleTable
              head={["Forma de pago", "Qué pide", "Qué pasa"]}
              rows={[
                [
                  "Efectivo",
                  "Monto recibido",
                  "Calcula el vuelto. Hay botones de montos rápidos (+$5.000, +$10.000, +$20.000, +$50.000) y \"Monto exacto\". Si el monto no alcanza, se marca en rojo cuánto falta por cobrar.",
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
                  "Queda pendiente de cobro a nombre de esa persona. Aparece después en Reportes → \"Fiado por cobrar\".",
                ],
              ]}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Anular una venta
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Desde el historial de ventas, con el botón de anular sobre la
              venta ya registrada. Pide confirmación porque no se puede
              deshacer: la venta queda marcada como anulada (tachada, con la
              etiqueta correspondiente) y el stock vendido se devuelve al
              inventario. No se usa para corregir un error menor de una venta
              que sigue en pie: para eso conviene anularla y volver a
              registrarla bien.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Cierre del día: cuándo usarlo en vez de venta por venta
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Cuando no se alcanzó a registrar cada venta y solo se quiere
              dejar el total del día, igual que en el Excel.
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
                  notas: "Se calcula sola al 19% de la venta; se puede corregir a mano.",
                },
                { campo: "Gasto", obligatorio: false },
                { campo: "Compra", obligatorio: false },
                { campo: "Entrada de caja", obligatorio: false },
                { campo: "Salida de caja", obligatorio: false },
              ]}
            />
            <Callout tone="warning" title="Solo un cierre por fecha">
              El sistema no deja crear dos cierres para el mismo día: si ya
              existe uno, avisa <span className="font-mono">Ya existe un
              cierre para esa fecha</span>. El historial de la sección, con
              filtros por año y mes, sirve para revisar el que ya quedó
              registrado.
            </Callout>
          </div>
        </Section>

        <Section
          id="pedidos"
          icon={ClipboardList}
          numero={5}
          titulo="Pedidos a proveedores"
          proposito="Lo que se le encarga a cada proveedor y cuándo llega."
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Crear un pedido
            </h3>
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
              Después se buscan y agregan los productos con su cantidad y
              costo unitario (a diferencia de Ventas, aquí no hay tope de
              cantidad: se está pidiendo, no vendiendo). También se puede
              adjuntar la foto de la factura o el comprobante. Si el proveedor
              escrito coincide con uno anterior, aparece el botón{" "}
              <span className="font-medium">Repetir último pedido</span> para
              copiar esas mismas líneas.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Cómo entra la mercancía al inventario
            </h3>
            <SimpleTable
              head={["Estado", "Qué significa", "¿Mueve el inventario?"]}
              rows={[
                ["Pendiente", "El pedido se registró y se está esperando.", "No."],
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
              <span className="font-medium">Recibido</span> suma el stock, y
              solo esa acción.
            </Callout>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Qué hacer cuando el proveedor no cumple
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              El sistema marca solo, con la etiqueta{" "}
              <span className="font-medium text-amber-700">
                Entrega atrasada
              </span>
              , los pedidos pendientes cuya fecha de entrega ya pasó. Si el
              pedido ya no se va a recibir, se cancela desde el historial;
              esa acción tampoco se puede deshacer.
            </p>
          </div>
        </Section>

        <Section
          id="gastos"
          icon={Wallet}
          numero={6}
          titulo="Gastos y caja"
          proposito="A dónde se va la plata que no es mercancía."
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Los tres tipos de registro
            </h3>
            <SimpleTable
              head={["Tipo", "Para qué es"]}
              rows={[
                ["Gasto", "Un gasto del negocio: servicios, arriendo, insumos, lo que sea."],
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
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Registrar uno
            </h3>
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
                  notas: "Escribir algo que se reconozca después, no solo \"gasto\".",
                },
                { campo: "Nota", obligatorio: false },
              ]}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Revisar un período
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Se filtra por tipo, año, mes o por texto libre sobre el
              concepto. Arriba de la tabla quedan los totales de gastos,
              entradas y salidas, y el neto del período (entradas menos
              salidas menos gastos), en rojo cuando da negativo.
            </p>
          </div>

          <Callout tone="info" title="Por qué algunos registros de 2025 no tienen detalle">
            Los del Excel solo traían un total de gasto por día, sin decir en
            qué se fue; por eso aparecen sin concepto detallado. Las entradas
            y salidas de caja de ese año solo se llevaron de enero a abril.
          </Callout>
        </Section>

        <Section
          id="reportes"
          icon={BarChart3}
          numero={7}
          titulo="Reportes"
          proposito="Leer los números del negocio sin ser contador."
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Elegir el período
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Hoy, últimos 7 días, últimos 30 días, este mes, o un rango de
              fechas elegido a mano. Los períodos se cuentan a partir del
              último día que tiene datos cargados (hoy, hasta donde llega la
              contabilidad importada del Excel), no necesariamente desde la
              fecha de hoy; si es el caso, la pantalla lo avisa.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Qué muestra
            </h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
              <li>
                Cuatro indicadores del período, comparados contra el período
                anterior equivalente: cuánto se vendió, cuánto se ganó, cuánto
                se gastó, y el margen (de cada $100 vendidos, cuántos quedan
                de ganancia).
              </li>
              <li>
                Una gráfica de barras de ventas o ganancia por día (por
                semana si el rango pasa de 31 días); al hacer clic en una
                barra se ve el detalle de ese día o semana.
              </li>
              <li>
                <span className="font-medium">Fiado por cobrar:</span> lista
                las ventas registradas como fiado que siguen pendientes, con
                el nombre del cliente y el total.
              </li>
            </ul>
          </div>

          <Callout tone="info" title="Tarjetas que todavía están esperando datos">
            "Qué se vendió y cuánto ganaste", "Se te van a acabar pronto",
            "Plata quieta en la estantería" y "Cómo te pagaron" necesitan
            ventas registradas producto por producto y con método de pago; el
            histórico importado del Excel solo traía el total del día, así
            que esas tarjetas se van a ir llenando a medida que se registren
            ventas desde la aplicación.
          </Callout>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Descargar o imprimir
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              El botón <span className="font-medium">Descargar Excel</span>{" "}
              baja un archivo CSV (se abre bien en Excel, aunque no es un
              .xlsx) con fecha, venta, ganancia, gasto, compra, entrada y
              salida de caja del período elegido. El botón{" "}
              <span className="font-medium">Imprimir</span> abre el diálogo de
              impresión del navegador.
            </p>
          </div>
        </Section>

        <Section
          id="dia-a-dia"
          icon={CalendarCheck}
          numero={8}
          titulo="El día a día"
          proposito="La rutina completa, de abrir a cerrar."
        >
          <Steps
            items={[
              <>
                <span className="font-medium">Al abrir:</span> revisar Inicio
                para ver el stock bajo y lo pendiente del día anterior
                (pedidos atrasados, fiados sin cobrar).
              </>,
              <>
                <span className="font-medium">Durante el día:</span> registrar
                cada venta en{" "}
                <span className="font-medium">Ventas → Venta por venta</span>{" "}
                y anotar los gastos o movimientos de caja en{" "}
                <span className="font-medium">Gastos y caja</span> a medida
                que ocurren.
              </>,
              <>
                <span className="font-medium">Al cerrar:</span> si se
                registró venta por venta durante el día, no hace falta nada
                más; si no se alcanzó, dejar el total en{" "}
                <span className="font-medium">Ventas → Cierre del día</span>.
              </>,
              <>
                <span className="font-medium">Una vez por semana:</span>{" "}
                revisar los pedidos pendientes y atrasados, y aprovechar para
                confirmar algún costo que siga marcado como estimado.
              </>,
            ]}
          />
        </Section>

        <Section
          id="problemas"
          icon={HelpCircle}
          numero={9}
          titulo="Problemas comunes"
          proposito="Qué significa cada aviso que puede aparecer, y qué hacer."
        >
          <SimpleTable
            head={["Aviso", "Qué significa / qué hacer"]}
            rows={[
              [
                '"Ya existe un cierre para esa fecha"',
                "Ese día ya se cerró antes. Revisa el historial de Cierre del día para verlo, en vez de crear uno nuevo.",
              ],
              [
                '"Agrega al menos un producto"',
                "Se intentó registrar una venta o un pedido sin ninguna línea agregada.",
              ],
              [
                '"El monto recibido debe cubrir el total"',
                "En una venta en efectivo, el monto recibido es menor que el total a cobrar.",
              ],
              [
                '"Sin stock disponible para agregar" / "Sin más stock disponible"',
                "Se intentó vender más unidades de las que hay en inventario para ese producto.",
              ],
              [
                '"El nombre es obligatorio" / "El SKU es obligatorio"',
                "Faltan datos obligatorios al guardar un producto.",
              ],
              [
                'Fila con error al importar ("Falta el nombre", "Precio inválido", etc.)',
                "Esa fila del CSV no se va a importar. Se corrige en el archivo y se vuelve a intentar; el resto de filas válidas no se pierden.",
              ],
              [
                '"Permite las ventanas emergentes para..."',
                "El navegador bloqueó la ventana de impresión o del PDF. Hay que permitir las ventanas emergentes para este sitio e intentar de nuevo.",
              ],
              [
                "Un botón de Deshacer aparece un momento y luego desaparece",
                "Es normal: después de borrar algo hay unos segundos para deshacerlo antes de que quede confirmado.",
              ],
            ]}
          />
        </Section>

        <Section
          id="glosario"
          icon={Type}
          numero={10}
          titulo="Palabras del sistema"
          proposito="Las palabras que usa la aplicación, explicadas sin rodeos."
        >
          <SimpleTable
            head={["Palabra", "Qué significa"]}
            rows={[
              [
                "SKU",
                "Código interno del producto. Lo pone quien carga el producto, no viene de una autoridad externa.",
              ],
              [
                "Costo estimado",
                "Costo calculado como precio × 0,81 porque no viene de una factura. Se muestra con ~ y en gris hasta que se confirme a mano.",
              ],
              [
                "Margen",
                "Ganancia (precio menos costo) medida sobre el precio de venta, no sobre el costo.",
              ],
              ["Stock bajo", "10 unidades o menos en inventario."],
              ["Agotado", "0 unidades en inventario."],
              [
                "Cierre diario",
                "Registro de un día completo con un solo total de venta, ganancia, gasto y compra, sin el detalle de cada transacción. Es el formato que usaba el Excel.",
              ],
              [
                "Fiado",
                "Venta a crédito: no se cobró en el momento, queda pendiente a nombre de un cliente.",
              ],
              [
                "Recibido (pedido)",
                "Estado de un pedido que confirma que llegó la mercancía y suma el stock al inventario.",
              ],
              [
                "Anular (venta)",
                "Deja sin efecto una venta ya registrada y devuelve el stock vendido; no la borra, la marca como anulada.",
              ],
              [
                "Modo simulación",
                "Copia de prueba de la aplicación con datos inventados, aislada en la pestaña del navegador; no toca la información real de la tienda.",
              ],
            ]}
          />
        </Section>
      </div>

      {/* -------------------------------------------------------------- FAQ --- */}
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
            La venta no queda registrada y el stock no se descuenta: es como
            si no hubiera pasado. Solo se guarda cuando se hace clic en{" "}
            <span className="font-medium">Registrar venta</span>.
          </Faq>

          <Faq q="¿Los datos de la simulación pueden dañar la tienda real?">
            No. La simulación vive aparte, guardada en la pestaña del
            navegador; nunca lee ni escribe la información real de la tienda.
          </Faq>

          <Faq q="Me equivoqué en una venta que ya registré, ¿cómo la corrijo?">
            Se anula desde el historial de Ventas (el stock vendido se
            devuelve solo al inventario) y se vuelve a registrar bien. No hay
            forma de editar una venta ya confirmada.
          </Faq>

          <Faq q="¿Puedo recuperar un producto que borré por error?">
            Justo después de borrarlo aparece un aviso con la opción{" "}
            <span className="font-medium">Deshacer</span> durante unos
            segundos. Pasado ese tiempo, hay que volver a crearlo a mano.
          </Faq>

          <Faq q="¿Por qué el costo de un producto aparece con ~ y en gris?">
            Porque es un costo estimado (precio × 0,81), no uno tomado de una
            factura real. Se confirma editando el producto y escribiendo el
            costo a mano; la marca de estimado se quita sola.
          </Faq>

          <Faq q="¿Por qué algunas tablas de Reportes dicen 'Esperando datos'?">
            Porque necesitan ventas registradas producto por producto o con
            método de pago, y el histórico importado del Excel solo traía el
            total del día. Se van a ir llenando a medida que se use el punto
            de venta.
          </Faq>

          <Faq q="¿Cómo sé cuánto me deben los clientes que compraron fiado?">
            En <span className="font-medium">Reportes → Fiado por cobrar</span>
            , dentro del período que se esté mirando.
          </Faq>

          <Faq q="Intenté cerrar el mismo día dos veces y no me dejó, ¿por qué?">
            Solo puede existir un cierre por fecha. El aviso "Ya existe un
            cierre para esa fecha" significa que ese día ya quedó registrado;
            se revisa en el historial de Cierre del día en vez de crear otro.
          </Faq>

          <Faq q="¿Recibir un pedido y crearlo hacen lo mismo con el inventario?">
            No. Crear un pedido nunca mueve el inventario. Solo marcarlo como{" "}
            <span className="font-medium">Recibido</span> suma el stock de
            cada producto del pedido.
          </Faq>

          <Faq q="¿Para qué sirve la sección Configuración?">
            Todavía para nada: está reservada para más adelante y hoy no
            tiene ningún ajuste disponible.
          </Faq>

          <Faq q="¿Qué significa el chip 'Conectado' de la barra superior?">
            Confirma que el inicio de sesión (el servicio de autenticación)
            está respondiendo. No quiere decir que el catálogo, las ventas o
            los pedidos ya estén guardados en una base de datos permanente.
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
    </div>
  );
}
