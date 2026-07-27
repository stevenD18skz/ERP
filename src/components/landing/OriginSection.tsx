import { AlertTriangle, CalendarClock, Database } from "lucide-react";

// De dónde salieron los datos. La tercera tarjeta va en ámbar a propósito: lo
// que falta se dice igual de fuerte que lo que ya está.
export default function OriginSection() {
  return (
    <section
      aria-labelledby="origen"
      className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16"
    >
      <h2
        id="origen"
        className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl"
      >
        No empezó en cero
      </h2>
      <p className="mt-3 max-w-2xl text-slate-600">
        El sistema se armó a partir del archivo de contabilidad que ya llevaba la
        tienda durante 2025. Todo lo que ese archivo registraba está adentro; lo
        que nunca registró, está señalado como pendiente en vez de rellenado a la
        fuerza.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Database className="h-5 w-5 text-blue-600" aria-hidden />
          <h3 className="mt-3 font-semibold text-slate-900">Lo que se trajo</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Los 435 productos con su precio, y los 365 días del año con su venta,
            ganancia, gasto y compra. Los totales cuadran con los del archivo, mes
            por mes.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <CalendarClock className="h-5 w-5 text-teal-600" aria-hidden />
          <h3 className="mt-3 font-semibold text-slate-900">
            Lo que cambia desde ahora
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            El archivo guardaba un solo total por día. De aquí en adelante se
            puede registrar venta por venta, con productos, forma de pago y
            cliente, sin dejar de poder cerrar el día como antes.
          </p>
        </article>

        <article className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden />
          <h3 className="mt-3 font-semibold text-slate-900">
            Lo que queda pendiente
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            El inventario arranca en cero porque el archivo nunca lo llevó: hay
            que contar. Y 398 productos tienen el costo calculado a partir del
            precio, no de una factura; la aplicación los muestra marcados para
            poder corregirlos.
          </p>
        </article>
      </div>
    </section>
  );
}
