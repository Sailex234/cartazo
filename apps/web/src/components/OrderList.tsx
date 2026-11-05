"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, getOrders, type Order } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./OrderView";

export function OrderList() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getOrders().then(setOrders).catch((e) => setError(e.message));
  }, [user]);

  if (loading) return <p className="text-muted">Cargando…</p>;
  if (!user) return <EmptyState title="Ingresá para ver tus órdenes" href="/login" action="Ingresar" />;
  if (error) return <p className="text-danger">{error}</p>;
  if (!orders) return <p className="text-muted">Cargando órdenes…</p>;
  if (orders.length === 0) {
    return <EmptyState title="Todavía no hiciste compras" text="Cuando compres, vas a ver tus órdenes acá." href="/" action="Ver catálogo" />;
  }

  return (
    <ul className="card flex flex-col divide-y divide-line">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 hover:bg-surface-muted">
            <span>
              <span className="font-medium">{new Date(o.createdAt).toLocaleDateString("es-AR")}</span>
              <span className="block text-sm text-muted">{o.items.reduce((n, i) => n + i.quantity, 0)} producto(s)</span>
            </span>
            <span className="flex items-center gap-4">
              <StatusBadge status={o.status} />
              <span className="font-semibold">{formatPrice(o.total)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
