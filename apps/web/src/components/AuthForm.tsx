"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginSchema, registerSchema } from "@cartazo/shared";
import { ApiError, login, register } from "@/lib/api";
import { useAuth } from "./AuthProvider";

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

  const [showPassword, setShowPassword] = useState(false);

  // Acceso rápido para la demo pública (credenciales del seed, sin ningún dato real).
  async function demoLogin(email: string, password: string) {
    setError(null);
    setPending(true);
    try {
      setUser(await login({ email, password }));
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl overflow-hidden rounded-xl border border-line bg-surface shadow-sm md:min-h-[460px] md:grid-cols-2">
      <aside
        aria-hidden
        className="hidden flex-col justify-between bg-[linear-gradient(160deg,var(--brand),var(--brand-hover))] p-8 text-white md:flex"
      >
        <p className="text-2xl font-black italic">Cartazo</p>
        <div>
          <div className="text-7xl leading-none">🧺</div>
          <p className="mt-4 text-2xl font-black leading-tight">Tu mercado de barrio, ahora online.</p>
          <p className="mt-2 text-sm text-white/85">Armá tu carrito y pagá seguro con MercadoPago.</p>
        </div>
        <span className="w-fit rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-fg">Ofertas todas las semanas</span>
      </aside>

      <form onSubmit={onSubmit} className="flex flex-col justify-center gap-5 p-6 sm:p-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isRegister ? "Creá tu cuenta" : "Iniciá sesión"}</h1>
          <p className="mt-1 text-sm text-muted">
            {isRegister ? "Registrate para empezar a comprar." : "Accedé con tu cuenta para seguir comprando."}
          </p>
        </div>
        {isRegister && (
          <div>
            <label htmlFor="name" className="text-xs font-semibold">Nombre</label>
            <input id="name" name="name" placeholder="Tu nombre" autoComplete="name" className="field-input" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="text-xs font-semibold">Correo electrónico</label>
          <input id="email" name="email" type="email" placeholder="Ingresá tu correo" autoComplete="email" className="field-input" />
        </div>
        <div>
          <label htmlFor="password" className="text-xs font-semibold">Contraseña</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={isRegister ? "Mínimo 8 caracteres" : "Ingresá tu contraseña"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="field-input pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted hover:text-brand"
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button disabled={pending} className="btn btn-primary btn-lg w-full">
          {pending ? "Enviando…" : isRegister ? "Crear cuenta" : "Iniciar sesión"}
        </button>
        {process.env.NEXT_PUBLIC_DEMO === "true" && !isRegister && (
          <div className="flex flex-col gap-2 rounded-lg bg-brand-soft p-3 text-xs">
            <p className="font-semibold">Probá la demo sin registrarte:</p>
            <button type="button" disabled={pending} onClick={() => demoLogin("admin@cartazo.com", "admin12345")} className="btn btn-secondary w-full">
              Entrar como admin (panel de inventario)
            </button>
          </div>
        )}
        <p className="text-center text-sm text-muted">
          {isRegister ? "¿Ya tenés cuenta? " : "¿No tenés cuenta? "}
          <Link href={isRegister ? "/login" : "/register"} className="font-bold text-foreground underline underline-offset-4 hover:text-brand">
            {isRegister ? "Iniciá sesión" : "Registrate"}
          </Link>
        </p>
      </form>
    </div>
  );
}
