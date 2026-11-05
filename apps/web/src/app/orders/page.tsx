import { OrderList } from "@/components/OrderList";

export const metadata = { title: "Mis órdenes — Cartazo" };

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Mis órdenes</h1>
      <OrderList />
    </div>
  );
}
