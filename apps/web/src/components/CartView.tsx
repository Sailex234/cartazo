"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, checkout, formatPrice, getCart, removeCartItem, updateCartItem, type Cart } from "@/lib/api";
import { useAuth } from "./AuthProvider";

export function CartView() {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCart().then(setCart).catch((e) => setError(e.message));
  }, [user]);

  if (authLoading) return <p>Cargando…</p>;
  if (!user) {
    return (
      <p>
        <Link href="/login" className="underline">Ingresá</Link> para ver tu carrito.
      </p>
    );
  }
  if (!cart) return <p>{error ?? "Cargando carrito…"}</p>;
  if (cart.items.length === 0) {
    return (
      <p>
        Tu carrito está vacío. <Link href="/" className="underline">Ver catálogo</Link>
      </p>
    );
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

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {cart.items.map(({ id, productId, quantity, product }) => (
          <li key={id} className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div>
              <Link href={`/products/${productId}`} className="font-medium underline">{product.name}</Link>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{formatPrice(product.price)} c/u</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                aria-label="Menos"
                disabled={busy || quantity <= 1}
                onClick={() => run(() => updateCartItem(productId, quantity - 1))}
                className="h-10 w-10 rounded-md border disabled:opacity-50"
              >−</button>
              <span aria-live="polite" aria-label={`Cantidad: ${quantity}`}>{quantity}</span>
              <button
                aria-label="Más"
                disabled={busy || quantity >= product.stock}
                onClick={() => run(() => updateCartItem(productId, quantity + 1))}
                className="h-10 w-10 rounded-md border disabled:opacity-50"
              >+</button>
              <button disabled={busy} onClick={() => run(() => removeCartItem(productId))} className="py-2 text-sm underline">
                Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xl font-semibold">Total: {formatPrice(String(total))}</p>
        <button
          onClick={pay}
          disabled={busy}
          className="rounded-md bg-black px-6 py-3 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          Pagar con MercadoPago
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
    </div>
  );
}
