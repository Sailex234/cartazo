import { EditProduct } from "@/components/EditProduct";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Editar producto</h1>
      <EditProduct id={id} />
    </div>
  );
}
