"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

const navLink = "rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-surface-muted";

export function HeaderNav() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) return <div className="h-8 w-40" aria-hidden />;

  if (!user) {
    return (
      <nav aria-label="Principal" className="flex flex-wrap items-center gap-1 text-sm">
        <Link href="/login" className={navLink}>Ingresar</Link>
        <Link href="/register" className="btn btn-primary btn-sm">Crear cuenta</Link>
      </nav>
    );
  }

  return (
    <nav aria-label="Principal" className="flex flex-wrap items-center gap-1 text-sm">
      {user.role === "ADMIN" && <Link href="/admin" className={navLink}>Admin</Link>}
      <Link href="/cart" className={navLink}>Carrito</Link>
      <Link href="/orders" className={navLink}>Mis órdenes</Link>
      <span className="ml-2 hidden items-center gap-2 border-l border-line pl-3 sm:flex">
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-soft-fg"
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span className="text-muted">{user.name}</span>
      </span>
      <button
        onClick={async () => {
          await logout();
          router.refresh();
        }}
        className={`${navLink} text-muted`}
      >
        Salir
      </button>
    </nav>
  );
}
