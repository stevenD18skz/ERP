"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StoreIcon, Loader2 } from "lucide-react";

import { isSimulationOn, stopSimulation } from "@/lib/simulation/store";

export default function SignupPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [dueno, setDueno] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, dueno, password }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error?.message || "No se pudo crear la tienda");
        return;
      }
      // Misma razón que en /login: una tienda nueva real no debe quedar
      // tapada por una simulación que haya quedado encendida en la pestaña.
      if (isSimulationOn()) stopSimulation();

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
            <StoreIcon className="h-6 w-6 text-teal-600" aria-hidden />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            Crear una tienda nueva
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Arranca vacía, separada de cualquier otra tienda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="nombre"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Nombre de la tienda
            </label>
            <input
              id="nombre"
              type="text"
              autoComplete="off"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              placeholder="The Sunny Go"
            />
          </div>

          <div>
            <label
              htmlFor="dueno"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Dueño
            </label>
            <input
              id="dueno"
              type="text"
              autoComplete="off"
              required
              value={dueno}
              onChange={(e) => setDueno(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              placeholder="Steven"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={4}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={4}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear tienda
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes una tienda?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
