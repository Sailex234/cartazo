"use client";

import { useAuth } from "./AuthProvider";
import { EmptyState } from "./EmptyState";

// Guard de UX, no de seguridad: la sesión vive en una cookie httpOnly que solo
// la API puede leer, así que acá solo decidimos qué mostrar. La protección real
// es requireRole('ADMIN') en cada endpoint de escritura de la API. 🔎
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="text-muted">Cargando…</p>;
  if (!user) return <EmptyState title="Ingresá para acceder al panel" href="/login" action="Ingresar" />;
  if (user.role !== "ADMIN") return <EmptyState title="No tenés permisos para ver esta sección" href="/" action="Volver al catálogo" />;

  return <>{children}</>;
}
