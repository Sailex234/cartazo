"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function HeaderNav() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) return <div className="h-6 w-32" aria-hidden />;

  if (!user) {
    return (
      <nav aria-label="Principal" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <Link href="/login" className="underline">Ingresar</Link>
        <Link href="/register" className="rounded-md bg-black px-3 py-1.5 text-white dark:bg-white dark:text-black">
          Crear cuenta
        </Link>
      </nav>
    );
  }

  return (
    <nav aria-label="Principal" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      {user.role === "ADMIN" && <Link href="/admin" className="underline">Admin</Link>}
      <Link href="/cart" className="underline">Carrito</Link>
      <Link href="/orders" className="underline">Mis órdenes</Link>
      <span className="hidden sm:inline">Hola, {user.name}</span>
      <button
        onClick={async () => {
          await logout();
          router.refresh();
        }}
        className="underline"
      >
        Salir
      </button>
    </nav>
  );
}
