import { CartView } from "@/components/CartView";

export const metadata = { title: "Carrito — Cartazo" };

export default function CartPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Tu carrito</h1>
      <CartView />
    </div>
  );
}
