"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const base =
  "w-full rounded-lg border bg-white px-3.5 text-[15px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-4";
// 48px de alto: por debajo de 44px el dedo falla, y en iOS un input con texto
// menor a 16px hace que el navegador acerque la página al enfocarlo.
const size = "min-h-[48px]";

const tone = (invalid) =>
  invalid
    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
    : "border-slate-300 focus:border-blue-500 focus:ring-blue-100";

export function AuthField({
  id,
  label,
  hint,
  invalid = false,
  className = "",
  ...inputProps
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={invalid || undefined}
        className={`${base} ${size} ${tone(invalid)} ${className}`}
        {...inputProps}
      />
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// Campo de contraseña con el ojo para ver lo que se escribió. En un mostrador
// se teclea con una mano y con prisa: sin esto, un error de dedo solo se
// descubre cuando el login falla.
export function PasswordField({ id, label, hint, invalid = false, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={invalid || undefined}
          className={`${base} ${size} ${tone(invalid)} pr-12`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// El aviso de error se anuncia solo a los lectores de pantalla: quien no ve la
// pantalla se enteraría del fallo únicamente al volver a recorrer el
// formulario.
export function AuthError({ message }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
    >
      {message}
    </p>
  );
}
