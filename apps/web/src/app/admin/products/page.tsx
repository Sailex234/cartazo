import { AdminProductTable } from "@/components/AdminProductTable";

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
      <AdminProductTable />
    </div>
  );
}
