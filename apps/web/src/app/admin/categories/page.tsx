import { AdminCategories } from "@/components/AdminCategories";

export default function AdminCategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
      <AdminCategories />
    </div>
  );
}
