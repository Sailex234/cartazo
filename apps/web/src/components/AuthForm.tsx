"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginSchema, registerSchema } from "@cartazo/shared";
import { ApiError, login, register } from "@/lib/api";
import { useAuth } from "./AuthProvider";

const input = "input";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));

    // El mismo schema Zod que valida en la API (packages/shared): feedback inmediato sin viaje de red.
    const parsed = isRegister ? registerSchema.safeParse(data) : loginSchema.safeParse(data);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(`${String(issue.path[0])}: ${issue.message}`);
      return;
    }

    setPending(true);
    try {
      const user = isRegister
        ? await register(registerSchema.parse(data))
        : await login(loginSchema.parse(data));
      setUser(user);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto flex w-full max-w-sm flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">{isRegister ? "Crear cuenta" : "Ingresar"}</h1>
      {isRegister && <input name="name" aria-label="Nombre" placeholder="Nombre" autoComplete="name" className={input} />}
      <input name="email" type="email" aria-label="Email" placeholder="Email" autoComplete="email" className={input} />
      <input
        name="password"
        type="password"
        aria-label="Contraseña"
        placeholder={isRegister ? "Contraseña (mín. 8 caracteres)" : "Contraseña"}
        autoComplete={isRegister ? "new-password" : "current-password"}
        className={input}
      />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button
        disabled={pending}
        className="btn btn-primary"
      >
        {pending ? "Enviando…" : isRegister ? "Crear cuenta" : "Ingresar"}
      </button>
      <p className="text-sm text-muted">
        {isRegister ? "¿Ya tenés cuenta? " : "¿No tenés cuenta? "}
        <Link href={isRegister ? "/login" : "/register"} className="link">
          {isRegister ? "Ingresar" : "Crear cuenta"}
        </Link>
      </p>
    </form>
  );
}
