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
      <nav className="flex items-center gap-4 text-sm">
        <Link href="/login" className="underline">Ingresar</Link>
        <Link href="/register" className="rounded-md bg-black px-3 py-1.5 text-white dark:bg-white dark:text-black">
          Crear cuenta
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-4 text-sm">
      <span>Hola, {user.name}</span>
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
