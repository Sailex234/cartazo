"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, getOrder, type Order } from "@/lib/api";
import { useAuth } from "./AuthProvider";

export const ORDER_STATUS_LABELS = { PENDING: "Pago pendiente", PAID: "Pago confirmado", CANCELLED: "Cancelada" } as const;

export function OrderView({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  // El webhook de MP puede tardar unos segundos en marcar la orden como PAID:
  // mientras siga PENDING, reconsulta cada 3s.
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const o = await getOrder(id);
        setOrder(o);
        if (o.status === "PENDING") timer = setTimeout(load, 3000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    };
    load();
    return () => clearTimeout(timer);
  }, [id, user]);

  if (loading) return <p>Cargando…</p>;
  if (!user) return <p><Link href="/login" className="underline">Ingresá</Link> para ver tu orden.</p>;
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
  if (!order) return <p>Cargando orden…</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-medium">{ORDER_STATUS_LABELS[order.status]}</p>
      <ul className="flex flex-col gap-1 text-sm">
        {order.items.map((i) => (
          <li key={i.id}>{i.quantity} × {i.product?.name ?? "Producto"} — {formatPrice(i.unitPrice)}</li>
        ))}
      </ul>
      <p className="text-xl font-semibold">Total: {formatPrice(order.total)}</p>
      <Link href="/orders" className="underline">Mis órdenes</Link>
    </div>
  );
}
