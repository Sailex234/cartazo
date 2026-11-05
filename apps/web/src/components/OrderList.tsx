"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, getOrders, type Order } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { ORDER_STATUS_LABELS } from "./OrderView";

export function OrderList() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getOrders().then(setOrders).catch((e) => setError(e.message));
  }, [user]);

  if (loading) return <p>Cargando…</p>;
  if (!user) return <p><Link href="/login" className="underline">Ingresá</Link> para ver tus órdenes.</p>;
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
  if (!orders) return <p>Cargando órdenes…</p>;
  if (orders.length === 0) {
    return <p>Todavía no hiciste compras. <Link href="/" className="underline">Ver catálogo</Link></p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-2 py-4 hover:underline">
            <span>
              {new Date(o.createdAt).toLocaleDateString("es-AR")} · {o.items.reduce((n, i) => n + i.quantity, 0)} producto(s)
            </span>
            <span className="flex gap-4">
              <span className="text-sm">{ORDER_STATUS_LABELS[o.status]}</span>
              <span className="font-semibold">{formatPrice(o.total)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
