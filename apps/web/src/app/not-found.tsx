import { EmptyState } from "@/components/EmptyState";

// 404 para cualquier URL que no matchea una ruta; se renderiza dentro del layout
// raíz, así que conserva el header. El de products/[id] sigue siendo más específico.
export default function NotFound() {
  return <EmptyState title="Página no encontrada" text="La dirección que buscás no existe o fue movida." href="/" action="Volver al catálogo" />;
}
