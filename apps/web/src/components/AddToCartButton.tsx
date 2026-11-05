"use client";

import Link from "next/link";
import { useState } from "react";
import { addToCart, ApiError } from "@/lib/api";
import { useAuth } from "./AuthProvider";

export function AddToCartButton({ productId, disabled }: { productId: string; disabled: boolean }) {
  const { user, loading } = useAuth();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  if (!loading && !user) {
    return (
      <Link href="/login" className="w-fit rounded-md bg-black px-6 py-3 text-white dark:bg-white dark:text-black">
        Ingresá para comprar
      </Link>
    );
  }

  const onClick = async () => {
    setPending(true);
    setMessage(null);
    try {
      await addToCart(productId);
      setMessage({ text: "Agregado al carrito", ok: true });
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : "No se pudo agregar", ok: false });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onClick}
        disabled={disabled || pending || loading}
        className="w-fit rounded-md bg-black px-6 py-3 text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Agregando…" : "Agregar al carrito"}
      </button>
      {message && (
        <p className={message.ok ? "text-sm text-green-700 dark:text-green-400" : "text-sm text-red-600 dark:text-red-400"} role="status">
          {message.text} {message.ok && <Link href="/cart" className="underline">Ver carrito</Link>}
        </p>
      )}
    </div>
  );
}
