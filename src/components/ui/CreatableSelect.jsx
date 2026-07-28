"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";

// Select con creación, del estilo del de Notion: se abre, se elige de la lista
// o se escribe. Mientras se escribe algo que todavía no existe, arriba de la
// lista aparece «Crear "maizena"». Lo que se crea no se guarda en el momento:
// queda elegido y nace en la base junto con el producto, en el mismo Guardar.
//
// Por qué crear tiene que ser un clic (o un Enter) y no simplemente escribir y
// salirse: un campo de texto suelto llena el catálogo de categorías gemelas
// —"Bebida", "bebidas", "Bebidad"— sin que nadie se dé cuenta. Al salir sin
// elegir, el campo vuelve a lo que estaba.
//
// value / onChange trabajan con { id, name }:
//   { id: "uuid", name: "Bebidas" }  algo que ya existe
//   { id: null,   name: "Maizena" }  se va a crear al guardar
//   null                             sin nada

const norm = (text) => String(text ?? "").trim().toLowerCase();

export default function CreatableSelect({
  id,
  value,
  onChange,
  options = [],
  placeholder = "Sin definir",
  createHint,
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [highlight, setHighlight] = useState(0);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selectedName = value?.name ?? "";
  const query = norm(text);

  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((option) => norm(option.name).includes(query));
  }, [options, query]);

  const exists = (name) =>
    options.some((option) => norm(option.name) === norm(name));

  // Solo se ofrece crear lo que no está: escribir el nombre completo de una
  // categoría que ya existe tiene que llevar a esa, no a una copia.
  const canCreate = query.length > 0 && !exists(text);

  // La fila de crear va primera para que Enter, sin tocar las flechas, haga lo
  // que quien está escribiendo espera.
  const rows = useMemo(
    () => [
      ...(canCreate ? [{ kind: "create", name: text.trim() }] : []),
      ...filtered.map((option) => ({ kind: "option", ...option })),
    ],
    [canCreate, text, filtered],
  );

  // Lo elegido todavía no existe en la lista: se va a crear al guardar y se
  // avisa. Se mira contra las opciones y no contra el id, porque en simulación
  // no hay ids.
  const isNew = Boolean(selectedName) && !exists(selectedName);

  useEffect(() => setHighlight(0), [text, open]);

  // Clic afuera: se cierra sin quedarse con lo que se estaba escribiendo.
  useEffect(() => {
    if (!open) return;
    const onDown = (event) => {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Que la fila resaltada no se quede fuera de la parte visible de la lista.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const openList = () => {
    if (disabled) return;
    setText("");
    setOpen(true);
    inputRef.current?.focus();
  };

  const close = () => {
    setOpen(false);
    setText("");
  };

  const choose = (row) => {
    if (!row) return;
    onChange(
      row.kind === "create"
        ? { id: null, name: row.name }
        : { id: row.id ?? null, name: row.name },
    );
    close();
  };

  const clear = () => {
    onChange(null);
    close();
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return openList();
      if (!rows.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setHighlight((i) => (i + step + rows.length) % rows.length);
      return;
    }
    if (event.key === "Enter") {
      // Sin esto, el Enter de elegir una categoría enviaría el formulario.
      event.preventDefault();
      if (!open) return openList();
      choose(rows[highlight]);
      return;
    }
    if (event.key === "Escape") {
      if (!open) return;
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "Tab" && open) close();
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div
        className={`mt-1.5 flex items-center gap-1 rounded-lg border bg-white px-1.5 transition-colors ${
          open
            ? "border-blue-500 ring-2 ring-blue-100"
            : "border-slate-200 hover:border-slate-300"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <input
          id={id}
          ref={inputRef}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={
            open && rows[highlight] ? `${id}-row-${highlight}` : undefined
          }
          disabled={disabled}
          value={open ? text : selectedName}
          placeholder={open ? "Escribe para buscar o crear" : placeholder}
          onChange={(event) => {
            setText(event.target.value);
            if (!open) setOpen(true);
          }}
          onMouseDown={() => !open && openList()}
          onKeyDown={onKeyDown}
          className="w-full bg-transparent px-2 py-2.5 text-[15px] outline-none placeholder:text-slate-400"
        />

        {selectedName && !open && (
          <button
            type="button"
            onClick={clear}
            aria-label="Quitar"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => (open ? close() : openList())}
          aria-label={open ? "Cerrar lista" : "Abrir lista"}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:text-slate-600"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isNew && !open && (
        <p className="mt-1 text-xs text-amber-700">
          «{selectedName}» {createHint ?? "todavía no existe: se crea al guardar el producto."}
        </p>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {/* El botón de crear va afuera de la lista y antes que ella, para que
              se vea siempre aunque haya que hacer scroll entre las opciones. */}
          {canCreate && (
            <button
              type="button"
              id={`${id}-row-0`}
              data-active={highlight === 0}
              onMouseEnter={() => setHighlight(0)}
              onClick={() => choose(rows[0])}
              className={`flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2.5 text-left text-sm font-semibold ${
                highlight === 0
                  ? "bg-blue-50 text-blue-700"
                  : "text-blue-600 hover:bg-slate-50"
              }`}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">Crear «{text.trim()}»</span>
            </button>
          )}

          <ul
            ref={listRef}
            id={`${id}-listbox`}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {filtered.map((option, index) => {
              const rowIndex = index + (canCreate ? 1 : 0);
              const active = highlight === rowIndex;
              const picked = norm(option.name) === norm(selectedName);
              return (
                <li key={option.id ?? option.name} role="none">
                  <button
                    type="button"
                    role="option"
                    id={`${id}-row-${rowIndex}`}
                    data-active={active}
                    aria-selected={picked}
                    onMouseEnter={() => setHighlight(rowIndex)}
                    onClick={() => choose(rows[rowIndex])}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                      active ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <Check
                      className={`h-3.5 w-3.5 shrink-0 ${picked ? "text-blue-600" : "text-transparent"}`}
                      aria-hidden
                    />
                    <span className="truncate text-slate-700">
                      {option.name}
                    </span>
                    {option.product_count > 0 && (
                      <span className="ml-auto shrink-0 text-xs text-slate-400">
                        {option.product_count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}

            {filtered.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-slate-500">
                {query
                  ? "Nada con ese nombre todavía."
                  : "Aún no hay ninguna. Escribe para crear la primera."}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
