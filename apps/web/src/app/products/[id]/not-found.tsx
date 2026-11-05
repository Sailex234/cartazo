import { EmptyState } from "@/components/EmptyState";

export default function NotFound() {
  return <EmptyState title="Producto no encontrado" text="Puede que ya no esté disponible." href="/" action="Volver al catálogo" />;
}
