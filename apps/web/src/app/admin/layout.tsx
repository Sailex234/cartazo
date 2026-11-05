import Link from "next/link";
import { AdminGuard } from "@/components/AdminGuard";

export const metadata = { title: "Admin — Cartazo" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Admin" className="flex flex-wrap items-center gap-1 border-b border-line pb-3 text-sm">
        <span className="badge badge-brand mr-2">Panel de admin</span>
        <Link href="/admin/products" className="rounded-lg px-3 py-1.5 font-medium hover:bg-surface-muted">Inventario</Link>
        <Link href="/admin/categories" className="rounded-lg px-3 py-1.5 font-medium hover:bg-surface-muted">Categorías</Link>
      </nav>
      <AdminGuard>{children}</AdminGuard>
    </div>
  );
}
