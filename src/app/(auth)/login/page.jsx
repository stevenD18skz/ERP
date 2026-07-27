"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { isSimulationOn, stopSimulation } from "@/lib/simulation/store";
import AuthShell from "@/components/auth/AuthShell";
import SubmitButton from "@/components/auth/SubmitButton";
import {
  AuthError,
  AuthField,
  PasswordField,
} from "@/components/auth/AuthField";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, password }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error?.message || "No se pudo iniciar sesión");
        return;
      }
      // Si esta pestaña había quedado con la simulación encendida, un login
      // real debe ganarle: si no, la cookie/sessionStorage de simulación
      // siguen mandando y el dashboard sigue mostrando datos de mentira.
      if (isSimulationOn()) stopSimulation();

      const from = searchParams.get("from");
      router.replace(from && from.startsWith("/") ? from : "/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setSubmitting(false);
    }
  };

  // Cuando el middleware manda acá por entrar a una pantalla protegida, se dice
  // por qué: sin eso, un redirect silencioso a login se lee como un error.
  const redirected = Boolean(searchParams.get("from"));

  return (
    <AuthShell
      title="Entra a tu tienda"
      subtitle={
        redirected
          ? "Para abrir esa pantalla primero hay que iniciar sesión."
          : "Con el nombre de la tienda y su contraseña."
      }
      footer={
        <p className="text-center text-sm text-slate-600">
          ¿Todavía no tienes tienda?{" "}
          <Link
            href="/signup"
            className="rounded font-semibold text-blue-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Crear una
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField
          id="nombre"
          label="Nombre de la tienda"
          type="text"
          autoComplete="username"
          autoFocus
          required
          invalid={!!error}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Mi tienda"
        />

        <PasswordField
          id="password"
          label="Contraseña"
          autoComplete="current-password"
          required
          invalid={!!error}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        <AuthError message={error} />

        <SubmitButton loading={submitting} loadingLabel="Entrando...">
          Entrar
        </SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
