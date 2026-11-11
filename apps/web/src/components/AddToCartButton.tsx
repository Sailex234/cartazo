"use client";

import Link from "next/link";
import { useState } from "react";
import { addToCart, ApiError } from "@/lib/api";
import { useAuth } from "./AuthProvider";

export function AddToCartButton({
  productId,
  disabled,
  compact = false,
}: {
  productId: string;
  disabled: boolean;
  compact?: boolean;
}) {
  const size = compact ? "w-full" : "btn-lg w-fit";
  const { user, loading } = useAuth();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  if (!loading && !user) {
    return (
      <Link href="/login" className={`btn btn-primary ${size}`}>
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
    <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
      <button
        onClick={onClick}
        disabled={disabled || pending || loading}
        className={`btn btn-primary ${size}`}
      >
        {pending ? "Agregando…" : disabled && compact ? "Sin stock" : "Agregar al carrito"}
      </button>
      {message && (
        <p className={message.ok ? "text-sm text-brand" : "text-sm text-danger"} role="status">
          {message.text} {message.ok && <Link href="/cart" className="link font-medium">Ver carrito</Link>}
        </p>
      )}
    </div>
  );
}
