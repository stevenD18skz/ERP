"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Maximize, Minus, Plus, X } from "lucide-react";

// Visor de una foto a pantalla completa: acercar, arrastrar para moverse y
// descargar. Se sale con Esc, con la X o tocando fuera de la imagen.
//
// Va en ui/ y no en products/ porque no sabe nada de productos: recibe una
// dirección de imagen y un título, y con eso le sirve a la tabla, a las
// tarjetas y a los dos modales.

const MIN_SCALE = 1;
const MAX_SCALE = 5;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const CONTROL_CLASS =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

// Nombre de archivo que el sistema no vaya a rechazar: sin tildes, sin espacios
// y sin signos.
const slugify = (value) =>
  (value || "")
    .normalize("NFD")
    // Los acentos quedan sueltos tras NFD; se borran para que "niño" salga
    // "nino" y no "nin-o".
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "producto";

const extensionOf = (src) => {
  const fromData = /^data:image\/([a-z0-9.+-]+)/i.exec(src);
  if (fromData) return fromData[1].toLowerCase() === "jpeg" ? "jpg" : fromData[1].toLowerCase();
  const fromUrl = /\.(jpe?g|png|webp|gif|avif|bmp)(?:[?#]|$)/i.exec(src);
  return fromUrl ? fromUrl[1].toLowerCase() : "jpg";
};

export default function ImageViewer({ src, title = "", onClose }) {
  const [scale, setScale] = useState(MIN_SCALE);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [interacting, setInteracting] = useState(false);
  const [notice, setNotice] = useState(null);

  const rootRef = useRef(null);
  const closeRef = useRef(null);

  // Punteros activos: uno es arrastrar, dos es pellizcar. Van en refs porque
  // cambian en cada movimiento del dedo y redibujar por eso sería absurdo.
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const drag = useRef(null);
  // Si hubo arrastre, el clic que viene después no cuenta como "tocar fuera":
  // soltar el dedo fuera de la imagen cerraría el visor a mitad de un
  // movimiento.
  const moved = useRef(false);

  // El foco entra al visor y vuelve a donde estaba al salir. La captura es a
  // propósito: el modal de abajo también escucha Escape y aquí solo se debe
  // cerrar la foto, no el formulario que la contiene.
  useEffect(() => {
    const restoreTo = document.activeElement;
    closeRef.current?.focus();

    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);

    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (restoreTo instanceof HTMLElement) restoreTo.focus();
    };
  }, [onClose]);

  // Guardar y devolver el valor anterior en vez de vaciarlo: encima de un modal
  // que ya lo había bloqueado, vaciarlo devolvería el scroll antes de tiempo.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // De vuelta al tamaño original la imagen se recentra sola; si no, queda
  // corrida y con nada que arrastrar para enderezarla.
  useEffect(() => {
    if (scale === MIN_SCALE) setOffset({ x: 0, y: 0 });
  }, [scale]);

  // La rueda va con passive:false porque hay que impedir que además haga
  // scroll de lo que quedó detrás del visor.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const onWheel = (e) => {
      e.preventDefault();
      setScale((prev) =>
        clamp(prev - e.deltaY * 0.0015 * prev, MIN_SCALE, MAX_SCALE),
      );
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (delta) =>
    setScale((prev) => clamp(prev + delta, MIN_SCALE, MAX_SCALE));

  const saveToDisk = (href) => {
    const link = document.createElement("a");
    link.href = href;
    link.download = `${slugify(title)}.${extensionOf(src)}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const download = async () => {
    setNotice(null);

    // Las fotos subidas por el dueño viajan dentro del propio dato, así que se
    // guardan directo.
    if (src.startsWith("data:") || src.startsWith("blob:")) {
      saveToDisk(src);
      return;
    }

    try {
      // Las que llegan del catálogo público son enlaces a otro dominio, y ahí
      // el atributo download no hace nada: hay que traer el archivo y guardarlo
      // desde acá.
      const response = await fetch(src, { mode: "cors" });
      if (!response.ok) throw new Error(String(response.status));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      saveToDisk(url);
      // Revocar de una cancelaría la descarga en algunos navegadores.
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      // Si ese dominio no da permiso (CORS) no hay forma de leer el archivo
      // desde la página. Se abre aparte y que el navegador la guarde con su
      // propio menú, que es lo único que sí funciona siempre.
      setNotice(
        "Esta foto vive en otro sitio y no deja guardarla desde aquí. Se abrió en otra pestaña para que la descargues con el menú del navegador.",
      );
      window.open(src, "_blank", "noopener,noreferrer");
    }
  };

  const closeIfOutside = (e) => {
    if (e.target === e.currentTarget && !moved.current) onClose();
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    setInteracting(true);

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale };
      drag.current = null;
    } else if (scale > MIN_SCALE) {
      drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinch.current?.distance > 0) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      moved.current = true;
      setScale(
        clamp(
          (distance / pinch.current.distance) * pinch.current.scale,
          MIN_SCALE,
          MAX_SCALE,
        ),
      );
      return;
    }

    if (drag.current) {
      moved.current = true;
      setOffset({
        x: e.clientX - drag.current.x,
        y: e.clientY - drag.current.y,
      });
    }
  };

  const onPointerUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      drag.current = null;
      setInteracting(false);
    }
  };

  const zoomed = scale > MIN_SCALE;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Foto de ${title}` : "Foto del producto"}
      onClick={closeIfOutside}
      className="fixed inset-0 z-[60] flex flex-col bg-slate-950/90 backdrop-blur-sm"
    >
      <div className="flex shrink-0 items-center gap-2 px-3 py-3 sm:px-4">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
          {title}
        </p>

        <button
          type="button"
          onClick={() => zoomBy(-0.5)}
          disabled={scale <= MIN_SCALE}
          aria-label="Alejar"
          className={CONTROL_CLASS}
        >
          <Minus className="h-5 w-5" aria-hidden />
        </button>

        <span
          aria-live="polite"
          className="w-12 shrink-0 text-center text-xs font-semibold tabular-nums text-white/70"
        >
          {Math.round(scale * 100)}%
        </span>

        <button
          type="button"
          onClick={() => zoomBy(0.5)}
          disabled={scale >= MAX_SCALE}
          aria-label="Acercar"
          className={CONTROL_CLASS}
        >
          <Plus className="h-5 w-5" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => setScale(MIN_SCALE)}
          disabled={!zoomed}
          aria-label="Ajustar a la pantalla"
          className={CONTROL_CLASS}
        >
          <Maximize className="h-5 w-5" aria-hidden />
        </button>

        <button
          type="button"
          onClick={download}
          aria-label="Descargar la foto"
          className={CONTROL_CLASS}
        >
          <Download className="h-5 w-5" aria-hidden />
        </button>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className={CONTROL_CLASS}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div
        onClick={closeIfOutside}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3 sm:p-6"
      >
        <img
          src={src}
          alt={title}
          draggable={false}
          onDoubleClick={() => setScale(zoomed ? MIN_SCALE : 2.5)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
          // touch-none deja que el pellizco lo maneje el visor y no el zoom del
          // navegador, que movería toda la página.
          className={`max-h-full max-w-full touch-none select-none object-contain ${
            interacting ? "" : "transition-transform duration-150"
          } motion-reduce:transition-none ${
            zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
          }`}
        />
      </div>

      {notice && (
        <p
          role="status"
          className="mx-auto max-w-lg shrink-0 px-4 pb-3 text-center text-xs leading-relaxed text-amber-200"
        >
          {notice}
        </p>
      )}

      <p className="hidden shrink-0 pb-3 text-center text-xs text-white/40 sm:block">
        Rueda o pellizco para acercar · doble clic para alternar · Esc para
        cerrar
      </p>
    </div>
  );
}
