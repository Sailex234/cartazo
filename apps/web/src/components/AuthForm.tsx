"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginSchema, registerSchema } from "@cartazo/shared";
import { ApiError, login, register } from "@/lib/api";
import { useAuth } from "./AuthProvider";

const input = "rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

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
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-2xl font-semibold">{isRegister ? "Crear cuenta" : "Ingresar"}</h1>
      {isRegister && <input name="name" placeholder="Nombre" autoComplete="name" className={input} />}
      <input name="email" type="email" placeholder="Email" autoComplete="email" className={input} />
      <input
        name="password"
        type="password"
        placeholder={isRegister ? "Contraseña (mín. 8 caracteres)" : "Contraseña"}
        autoComplete={isRegister ? "new-password" : "current-password"}
        className={input}
      />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Enviando…" : isRegister ? "Crear cuenta" : "Ingresar"}
      </button>
      <p className="text-sm text-zinc-500">
        {isRegister ? "¿Ya tenés cuenta? " : "¿No tenés cuenta? "}
        <Link href={isRegister ? "/login" : "/register"} className="underline">
          {isRegister ? "Ingresar" : "Crear cuenta"}
        </Link>
      </p>
    </form>
  );
}
