"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, checkout, formatPrice, getCart, removeCartItem, updateCartItem, type Cart } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { EmptyState } from "./EmptyState";
import { ProductImage } from "./ProductImage";

export function CartView() {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCart().then(setCart).catch((e) => setError(e.message));
  }, [user]);

  if (authLoading) return <p className="text-muted">Cargando…</p>;
  if (!user) {
    return <EmptyState title="Ingresá para ver tu carrito" href="/login" action="Ingresar" />;
  }
  if (!cart) return <p className={error ? "text-danger" : "text-muted"}>{error ?? "Cargando carrito…"}</p>;
  if (cart.items.length === 0) {
    return <EmptyState title="Tu carrito está vacío" text="Sumá productos desde el catálogo." href="/" action="Ver catálogo" />;
  }

  const total = cart.items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setCart(await getCart());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Algo salió mal");
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const { checkoutUrl } = await checkout();
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar el pago");
      setBusy(false);
    }
  };

  const units = cart.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
      <ul className="card flex flex-col divide-y divide-line px-4">
        {cart.items.map(({ id, productId, quantity, product }) => (
          <li key={id} className="flex flex-wrap items-center gap-4 py-4">
            <div className="w-20 shrink-0">
              <ProductImage src={product.imageUrl} alt={product.name} sizes="80px" />
            </div>
            <div className="min-w-40 flex-1">
              <Link href={`/products/${productId}`} className="font-medium hover:text-brand">{product.name}</Link>
              <p className="text-sm text-muted">{formatPrice(product.price)} c/u</p>
              <button disabled={busy} onClick={() => run(() => removeCartItem(productId))} className="link mt-1 py-1 text-sm text-muted">
                Quitar
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Menos"
                disabled={busy || quantity <= 1}
                onClick={() => run(() => updateCartItem(productId, quantity - 1))}
                className="btn btn-secondary h-10 w-10 !p-0"
              >−</button>
              <span aria-live="polite" aria-label={`Cantidad: ${quantity}`} className="w-8 text-center font-medium">{quantity}</span>
              <button
                aria-label="Más"
                disabled={busy || quantity >= product.stock}
                onClick={() => run(() => updateCartItem(productId, quantity + 1))}
                className="btn btn-secondary h-10 w-10 !p-0"
              >+</button>
            </div>
            <p className="w-28 text-right font-semibold">{formatPrice(String(Number(product.price) * quantity))}</p>
          </li>
        ))}
      </ul>
      <aside className="card flex flex-col gap-4 p-5 lg:sticky lg:top-24" aria-label="Resumen de la compra">
        <h2 className="text-lg font-semibold">Resumen</h2>
        <div className="flex justify-between text-sm text-muted">
          <span>{units} producto(s)</span>
          <span>{formatPrice(String(total))}</span>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-medium">Total</span>
          <span className="text-2xl font-bold">{formatPrice(String(total))}</span>
        </div>
        <button onClick={pay} disabled={busy} className="btn btn-primary btn-lg">Pagar con MercadoPago</button>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      </aside>
    </div>
  );
}
