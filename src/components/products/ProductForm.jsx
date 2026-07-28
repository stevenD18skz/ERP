"use client";

import { useEffect, useRef, useState } from "react";
import {
  DollarSign,
  ExternalLink,
  ImagePlus,
  Loader2,
  Maximize2,
  ScanLine,
  Sparkles,
  X,
} from "lucide-react";
import MoneyInput from "@/components/ui/MoneyInput";
import CreatableSelect from "@/components/ui/CreatableSelect";
import ImageViewer from "@/components/ui/ImageViewer";
import { lookupBarcode } from "@/services/barcode.service";
import { currency } from "@/utils/converts";
import { BARCODE_RE, FIELD_LABELS, LOOKUP_FIELDS } from "./productsUtils";

// Marca un campo cuyo valor no lo escribió nadie de la tienda sino que llegó de
// un catálogo público. Desaparece apenas se toca el campo, porque a partir de
// ahí el dato ya pasó por los ojos de quien registra.
const AutoBadge = ({ source }) => (
  <span
    title={`Dato traído de ${source}. Revísalo antes de guardar.`}
    className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 align-middle text-[10.5px] font-bold uppercase tracking-wide text-violet-700"
  >
    <Sparkles className="h-2.5 w-2.5" aria-hidden />
    Traído
  </span>
);

// Cómo le fue a la última consulta del código, justo debajo del campo. Se dice
// siempre qué pasó —incluso cuando no se llenó nada— porque quien registra está
// mirando la mercancía y no adivina si el botón hizo algo.
function LookupNote({ lookup }) {
  if (lookup.status === "idle" || lookup.status === "loading") return null;

  if (lookup.status === "found") {
    const label = lookup.name || "Ficha sin nombre";
    return lookup.filled.length ? (
      <p className="mt-1 text-xs text-violet-700">
        <span className="font-semibold">{label}</span> — se llenó{" "}
        {lookup.filled.map((key) => FIELD_LABELS[key] ?? key).join(", ")}.
      </p>
    ) : (
      <p className="mt-1 text-xs text-slate-500">
        <span className="font-semibold">{label}</span> — no se cambió nada: lo
        que ya estaba escrito manda.
      </p>
    );
  }

  const empty = lookup.status === "empty";
  return (
    <p className={`mt-1 text-xs ${empty ? "text-slate-500" : "text-red-600"}`}>
      {empty
        ? "Ese código no está en los catálogos públicos. Toca llenarlo a mano."
        : lookup.message}
    </p>
  );
}

export default function ProductForm({
  initial = null,
  prefill = null,
  barcodeOwner = () => null,
  skuOwner = () => null,
  categories = [],
  brands = [],
  onClose,
  onSave,
}) {
  // La categoría y la marca viajan por partida doble: el nombre es lo que se
  // ve y lo que se busca, el id es lo que guarda el producto. Cuando el id va
  // en null y el nombre no, es algo que todavía no existe y la API lo crea al
  // guardar (ver src/lib/api/taxonomy.ts).
  const [form, setForm] = useState(() => ({
    name: "",
    sku: "",
    barcode: "",
    price: "",
    cost_price: "",
    stock: "",
    category: "",
    category_id: null,
    brand: "",
    brand_id: null,
    description: "",
    ...initial,
    ...(prefill?.values ?? {}),
  }));
  const [photo, setPhoto] = useState(
    prefill?.values?.photo ?? initial?.photo ?? null,
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Qué campos llegaron de un catálogo público y todavía nadie confirmó. El
  // código de barras no cuenta: ese lo puso el lector sobre la mercancía real.
  const [autofilled, setAutofilled] = useState(() =>
    prefill?.source
      ? new Set(Object.keys(prefill.values).filter((key) => key !== "barcode"))
      : new Set(),
  );
  const [lookupSource, setLookupSource] = useState(prefill?.source ?? null);
  const [lookup, setLookup] = useState({ status: "idle" });
  // Arranca cerrado: el aviso solo estorba si alguien lo pide con el badge.
  const [lookupMessageVisible, setLookupMessageVisible] = useState(false);

  // Sin esto, mientras el modal está abierto la página de fondo también
  // scrollea y aparecen dos barras de desplazamiento a la vez.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const confirmField = (key) =>
    setAutofilled((s) => {
      if (!s.has(key)) return s;
      const next = new Set(s);
      next.delete(key);
      return next;
    });

  const setField = (key) => (e) => {
    const val = e.target.value;
    setForm((s) => ({ ...s, [key]: val }));
    setErrors((er) => (er[key] ? { ...er, [key]: undefined } : er));
    confirmField(key);
  };

  const setMoneyField = (key) => (val) => {
    setForm((s) => ({ ...s, [key]: val }));
    setErrors((er) => (er[key] ? { ...er, [key]: undefined } : er));
  };

  // Guarda el par nombre + id de la categoría o de la marca. next llega como
  // { id, name }, o null cuando se quitó.
  const setChoice = (key) => (next) => {
    setForm((s) => ({
      ...s,
      [key]: next?.name ?? "",
      [`${key}_id`]: next?.id ?? null,
    }));
    confirmField(key);
  };

  // Consulta desde el propio formulario, para cuando el código se escribe o se
  // escanea acá adentro (o al editar un producto viejo al que recién se le pone
  // el código). Solo llena lo que está vacío: lo que ya escribieron manda, que
  // para eso lo escribieron.
  const runLookup = async () => {
    const clean = String(form.barcode || "").trim();
    if (!BARCODE_RE.test(clean)) {
      setLookup({
        status: "invalid",
        message: "Son entre 8 y 14 dígitos, sin letras ni espacios",
      });
      return;
    }

    setLookupMessageVisible(true);
    setLookup({ status: "loading" });
    try {
      const found = await lookupBarcode(clean);
      if (!found) {
        setLookup({ status: "empty" });
        return;
      }

      const fills = {};
      for (const key of LOOKUP_FIELDS) {
        if (!String(form[key] ?? "").trim() && found[key]) {
          fills[key] = found[key];
        }
      }
      const takesPhoto = !photo && Boolean(found.photo);

      if (Object.keys(fills).length) setForm((s) => ({ ...s, ...fills }));
      if (takesPhoto) setPhoto(found.photo);

      const filled = [...Object.keys(fills), ...(takesPhoto ? ["photo"] : [])];
      setAutofilled((s) => new Set([...s, ...filled]));
      setLookupSource(found.source);
      setLookup({ status: "found", name: found.name, filled });
    } catch (err) {
      setLookup({ status: "error", message: err.message });
    }
  };

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      confirmField("photo");
    };
    reader.readAsDataURL(file);
  };

  const costNum = Number(form.cost_price);
  const priceNum = Number(form.price);
  const hasMarginPreview =
    form.cost_price !== "" &&
    form.price !== "" &&
    !Number.isNaN(costNum) &&
    !Number.isNaN(priceNum);
  const marginPreview = priceNum - costNum;
  // Sobre el precio de venta, igual que la contabilidad del negocio.
  const marginPreviewPct =
    priceNum > 0 ? Math.round((marginPreview / priceNum) * 100) : 0;

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!String(form.name).trim()) nextErrors.name = "El nombre es obligatorio";
    if (form.price === "" || Number(form.price) < 0)
      nextErrors.price = "Ingresa un precio válido";
    if (form.cost_price === "" || Number(form.cost_price) < 0)
      nextErrors.cost_price = "Ingresa un costo válido";
    if (form.stock === "" || Number(form.stock) < 0)
      nextErrors.stock = "Ingresa una cantidad de stock válida";

    // Dos productos con el mismo código dejan al lector de Ventas sin saber
    // cuál cobrar: agarra el primero que encuentra y nadie se entera.
    const clash = barcodeOwner(form.barcode, initial?.id);
    if (clash) {
      nextErrors.barcode = `Ese código ya es de "${clash.name}"`;
    }

    // El SKU repetido lo rechaza la base igual, pero avisar acá lo pone debajo
    // del campo que hay que corregir en vez de en un aviso al pie de pantalla.
    const skuClash = skuOwner(form.sku, initial?.id);
    if (skuClash) {
      nextErrors.sku = `Ese SKU ya es de "${skuClash.name}"`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSave({
        ...form,
        photo,
        price: Number(form.price),
        cost_price: Number(form.cost_price),
        // Si el costo se escribió a mano deja de ser el estimado del importador.
        cost_is_estimated: false,
        stock: Number(form.stock),
      });
    } catch {
      // el toast de error ya lo muestra el padre; se deja el formulario abierto
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (key) =>
    `mt-1.5 w-full rounded-lg border px-3.5 py-2.5 text-[15px] outline-none transition-colors focus:ring-2 ${errors[key]
      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
      : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
    }`;

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-8 backdrop-blur-sm"
      style={{ scrollbarGutter: "stable" }}
    >
      <form
        onSubmit={submit}
        noValidate
        className="w-full max-w-2xl shrink-0 animate-scale-in rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[22px] font-extrabold leading-none text-slate-900">
              {initial ? "Editar producto" : "Nuevo producto"}
            </h3>
            {autofilled.size > 0 && lookupSource && (
              <button
                type="button"
                onClick={() => setLookupMessageVisible(!lookupMessageVisible)}
                title={lookupMessageVisible ? "Ocultar datos importados" : "Ver datos importados"}
                aria-label={lookupMessageVisible ? "Ocultar datos importados" : "Ver datos importados"}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
                  lookupMessageVisible
                    ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {autofilled.size} campo{autofilled.size === 1 ? "" : "s"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-6 py-3">
          {autofilled.size > 0 && lookupSource && lookupMessageVisible && (
            <div className="relative rounded-lg border border-violet-100 bg-violet-50 px-3.5 py-3">
              <button
                type="button"
                onClick={() => setLookupMessageVisible(false)}
                aria-label="Cerrar mensaje"
                className="absolute right-3 top-3 rounded-full bg-white p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-violet-900">
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                {autofilled.size} campo{autofilled.size === 1 ? "" : "s"} vino de
                un catálogo público
              </p>
              <p className="mt-1 text-xs text-violet-800">
                Son datos del fabricante, no de tu negocio: revísalos contra el
                producto que tienes en la mano. Quedan anotados en la descripción
                para poder revisarlos después.
              </p>
              <a
                href={lookupSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 underline hover:text-violet-900"
              >
                Ver la ficha en {lookupSource.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <label className="text-sm">
            <span className="font-semibold text-slate-700">
              Nombre <span className="text-red-500">*</span>
            </span>
            {autofilled.has("name") && (
              <AutoBadge source={lookupSource?.label} />
            )}
            <input
              autoFocus
              value={form.name}
              onChange={setField("name")}
              placeholder="Ej. Leche entera 1L"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "error-name" : undefined}
              className={fieldClass("name")}
            />
            {errors.name && (
              <p
                id="error-name"
                className="mt-1 text-xs font-semibold text-red-600"
              >
                {errors.name}
              </p>
            )}
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            {/* <label className="text-sm">
              <span className="font-semibold text-slate-700">SKU</span>
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                opcional
              </span>
              <input
                value={form.sku}
                onChange={setField("sku")}
                placeholder="Ej. LAC-0012"
                aria-invalid={!!errors.sku}
                aria-describedby={errors.sku ? "error-sku" : "hint-sku"}
                className={fieldClass("sku")}
              />
              {errors.sku ? (
                <p
                  id="error-sku"
                  className="mt-1 text-xs font-semibold text-red-600"
                >
                  {errors.sku}
                </p>
              ) : (
                <p id="hint-sku" className="mt-1 text-xs text-slate-500">
                  Tu código interno. Útil sobre todo para lo que no trae código
                  de barras: granel, reempaque, hecho en casa.
                </p>
              )}
            </label>*/}

            <label className="text-sm">
              <span className="font-semibold text-slate-700">
                Stock inicial <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={setField("stock")}
                placeholder="0"
                aria-invalid={!!errors.stock}
                aria-describedby={errors.stock ? "error-stock" : undefined}
                className={`${fieldClass("stock")} sm:w-full`}
              />
              {errors.stock && (
                <p
                  id="error-stock"
                  className="mt-1 text-xs font-semibold text-red-600"
                >
                  {errors.stock}
                </p>
              )}
            </label>

            <div className="text-sm">
              <label
                htmlFor="form-barcode"
                className="font-semibold text-slate-700"
              >
                Código de barras
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="form-barcode"
                  inputMode="numeric"
                  value={form.barcode}
                  onChange={(e) => {
                    setForm((s) => ({ ...s, barcode: e.target.value }));
                    setErrors((er) =>
                      er.barcode ? { ...er, barcode: undefined } : er,
                    );
                    setLookup({ status: "idle" });
                  }}
                  onKeyDown={(e) => {
                    // Enter acá busca la ficha, no guarda el producto: es lo
                    // que manda el lector al terminar de leer, y guardar a
                    // medio llenar sería lo último que se quiere.
                    if (e.defaultPrevented) return;
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    runLookup();
                  }}
                  placeholder="Opcional"
                  aria-invalid={!!errors.barcode}
                  aria-describedby={errors.barcode ? "error-barcode" : undefined}
                  className={`w-full rounded-lg border px-3.5 py-2.5 font-mono text-[15px] outline-none transition-colors focus:ring-2 ${errors.barcode
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                    }`}
                />
                <button
                  type="button"
                  onClick={runLookup}
                  disabled={
                    lookup.status === "loading" || !String(form.barcode).trim()
                  }
                  title="Buscar la ficha del producto por su código"
                  aria-label="Buscar la ficha del producto por su código"
                  className="flex w-[44px] shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {lookup.status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ScanLine className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.barcode ? (
                <p
                  id="error-barcode"
                  className="mt-1 text-xs font-semibold text-red-600"
                >
                  {errors.barcode}
                </p>
              ) : (
                <LookupNote lookup={lookup} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-sm">
              <label
                htmlFor="form-category"
                className="font-semibold text-slate-700"
              >
                Categoría
              </label>
              {autofilled.has("category") && (
                <AutoBadge source={lookupSource?.label} />
              )}
              <CreatableSelect
                id="form-category"
                value={
                  form.category
                    ? { id: form.category_id ?? null, name: form.category }
                    : null
                }
                onChange={setChoice("category")}
                options={categories}
                placeholder="Sin categoría"
                createHint={
                  autofilled.has("category")
                    ? "es la clasificación del catálogo, no una de las tuyas: se crea al guardar."
                    : undefined
                }
              />
            </div>

            <div className="text-sm">
              <label
                htmlFor="form-brand"
                className="font-semibold text-slate-700"
              >
                Marca
              </label>
              {autofilled.has("brand") && (
                <AutoBadge source={lookupSource?.label} />
              )}
              <CreatableSelect
                id="form-brand"
                value={
                  form.brand
                    ? { id: form.brand_id ?? null, name: form.brand }
                    : null
                }
                onChange={setChoice("brand")}
                options={brands}
                placeholder="Sin marca"
                createHint={
                  autofilled.has("brand")
                    ? "es la marca que figura en el catálogo público: se crea al guardar."
                    : undefined
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1  sm:grid-cols-2">
            <div className="col-span-2 flex gap-4">
              <label className="flex-1 text-sm">
                <span className="font-semibold text-slate-700">
                  Costo <span className="text-red-500">*</span>
                </span>
                <MoneyInput
                  value={form.cost_price}
                  onChange={setMoneyField("cost_price")}
                  aria-invalid={!!errors.cost_price}
                  aria-describedby={
                    errors.cost_price ? "error-cost_price" : undefined
                  }
                  className={fieldClass("cost_price")}
                />
                {errors.cost_price && (
                  <p
                    id="error-cost_price"
                    className="mt-1 text-xs font-semibold text-red-600"
                  >
                    {errors.cost_price}
                  </p>
                )}
              </label>

              <label className="flex-1 text-sm">
                <span className="font-semibold text-slate-700">
                  Precio de venta <span className="text-red-500">*</span>
                </span>
                <MoneyInput
                  value={form.price}
                  onChange={setMoneyField("price")}
                  aria-invalid={!!errors.price}
                  aria-describedby={errors.price ? "error-price" : undefined}
                  className={fieldClass("price")}
                />
                {errors.price && (
                  <p
                    id="error-price"
                    className="mt-1 text-xs font-semibold text-red-600"
                  >
                    {errors.price}
                  </p>
                )}
              </label>
            </div>

            {hasMarginPreview && (
              <div className="col-span-2 flex items-center justify-center gap-2 rounded-b-3xl rounded-t-sm bg-emerald-50 px-3.5 py-2.5 text-[13.5px] font-semibold text-emerald-800">
                
                Ganancia por unidad: {marginPreview >= 0 ? "+" : ""}
                {currency(marginPreview)} ({marginPreviewPct >= 0 ? "+" : ""}
                {marginPreviewPct}% de la venta)
              </div>
            )}
          </div>


          <div>
            <span className="text-sm font-semibold text-slate-700">Foto</span>
            {autofilled.has("photo") && (
              <AutoBadge source={lookupSource?.label} />
            )}
            <div className="mt-1 flex items-center gap-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3.5">
              <div className="relative h-20 w-20 shrink-0">
                {/* Con foto puesta, tocarla la abre en grande; cambiarla ya
                    tiene su propio botón al lado y sustituir la de alguien por
                    accidente es peor que un clic de más. Vacía sigue siendo el
                    atajo para subir, que es lo único que se puede hacer ahí. */}
                <button
                  type="button"
                  onClick={() =>
                    photo ? setPhotoOpen(true) : fileInputRef.current?.click()
                  }
                  aria-label={photo ? "Ver la foto en grande" : "Subir una foto"}
                  className={`group flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    photo ? "relative cursor-zoom-in" : ""
                  }`}
                >
                  {photo ? (
                    <>
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:bg-slate-900/40 group-hover:opacity-100 group-focus-visible:bg-slate-900/40 group-focus-visible:opacity-100">
                        <Maximize2 className="h-4 w-4 text-white" aria-hidden />
                      </span>
                    </>
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-slate-400">
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-[10px] font-semibold">Subir</span>
                    </span>
                  )}
                </button>
                {photo && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      confirmField("photo");
                    }}
                    aria-label="Quitar foto"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-500 shadow ring-1 ring-slate-200 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onPhotoChange}
                className="hidden"
              />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-slate-700">
                  {autofilled.has("photo")
                    ? "Foto del catálogo"
                    : photo
                      ? "Foto cargada"
                      : "Sube una foto del producto"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {autofilled.has("photo")
                    ? "Queda como enlace: se ve mientras haya internet. Sube una propia si prefieres no depender de eso."
                    : "Ayuda a reconocerlo rápido en la lista y en Ventas."}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {photo ? "Cambiar foto" : "Elegir archivo"}
                </button>
              </div>
            </div>
          </div>

          <label className="text-sm">
            <span className="font-semibold text-slate-700">Descripción</span>
            {autofilled.has("description") && (
              <AutoBadge source={lookupSource?.label} />
            )}
            <textarea
              value={form.description}
              onChange={setField("description")}
              className={fieldClass("description")}
              rows={autofilled.has("description") ? 5 : 3}
            />
          </label>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Guardando..." : "Guardar producto"}
          </button>
        </div>
      </form>
    </div>

    {/* Hermano del modal y no hijo, para que quede por encima de él. */}
    {photoOpen && photo && (
      <ImageViewer
        src={photo}
        title={form.name || "Foto del producto"}
        onClose={() => setPhotoOpen(false)}
      />
    )}
    </>
  );
}
