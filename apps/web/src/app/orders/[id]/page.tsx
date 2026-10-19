import { OrderView } from "@/components/OrderView";

export const metadata = { title: "Tu orden — Cartazo" };

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Tu orden</h1>
      <OrderView id={id} />
    </div>
  );
}
