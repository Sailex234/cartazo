import { ProductForm } from "@/components/ProductForm";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Nuevo producto</h1>
      <ProductForm />
    </div>
  );
}
