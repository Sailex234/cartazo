import Link from "next/link";
import { AdminGuard } from "@/components/AdminGuard";

export const metadata = { title: "Admin — Cartazo" };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-4 border-b border-zinc-200 pb-3 text-sm dark:border-zinc-800">
        <span className="font-semibold">Panel de admin</span>
        <Link href="/admin/products" className="underline">Inventario</Link>
        <Link href="/admin/categories" className="underline">Categorías</Link>
      </nav>
      <AdminGuard>{children}</AdminGuard>
    </div>
  );
}
