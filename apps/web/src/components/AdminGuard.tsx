"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

// Guard de UX, no de seguridad: la sesión vive en una cookie httpOnly que solo
// la API puede leer, así que acá solo decidimos qué mostrar. La protección real
// es requireRole('ADMIN') en cada endpoint de escritura de la API. 🔎
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Cargando…</p>;
  if (!user) return <p><Link href="/login" className="underline">Ingresá</Link> para acceder al panel.</p>;
  if (user.role !== "ADMIN") return <p>No tenés permisos para ver esta sección.</p>;

  return <>{children}</>;
}
