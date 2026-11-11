"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

const icon = { "aria-hidden": true, viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const UserIcon = () => (
  <svg {...icon}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></svg>
);
const CartIcon = () => (
  <svg {...icon}><path d="M3 4h2.5l2.2 11h10.6l2-8H6.5" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>
);

const navLink = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-black/20";

export function HeaderNav() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  if (loading) return <div className="h-8 w-40" aria-hidden />;

  if (!user) {
    return (
      <nav aria-label="Principal" className="flex flex-wrap items-center gap-1 text-sm">
        <Link href="/login" className={navLink}><UserIcon /> Ingresar</Link>
        <Link href="/register" className="btn btn-sm bg-white text-brand hover:bg-white/90">Crear cuenta</Link>
      </nav>
    );
  }

  return (
    <nav aria-label="Principal" className="flex flex-wrap items-center gap-1 text-sm">
      {user.role === "ADMIN" && <Link href="/admin" className={navLink}>Admin</Link>}
      <Link href="/cart" className={navLink}><CartIcon /> Carrito</Link>
      <Link href="/orders" className={navLink}>Mis órdenes</Link>
      <span className="ml-2 hidden items-center gap-2 border-l border-white/30 pl-3 sm:flex">
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-brand"
        >
          {user.name.charAt(0).toUpperCase()}
        </span>
        <span>{user.name}</span>
      </span>
      <button
        onClick={async () => {
          await logout();
          router.refresh();
        }}
        className={`${navLink} opacity-90`}
      >
        Salir
      </button>
    </nav>
  );
}
