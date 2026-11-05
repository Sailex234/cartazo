"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, getOrder, type Order } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { EmptyState } from "./EmptyState";

export const ORDER_STATUS_LABELS = { PENDING: "Pago pendiente", PAID: "Pago confirmado", CANCELLED: "Cancelada" } as const;

export function StatusBadge({ status }: { status: keyof typeof ORDER_STATUS_LABELS }) {
  const cls = status === "PAID" ? "badge badge-brand" : status === "CANCELLED" ? "badge badge-danger" : "badge";
  return <span className={cls}>{ORDER_STATUS_LABELS[status]}</span>;
}

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

  if (loading) return <p className="text-muted">Cargando…</p>;
  if (!user) return <EmptyState title="Ingresá para ver tu orden" href="/login" action="Ingresar" />;
  if (error) return <p className="text-danger">{error}</p>;
  if (!order) return <p className="text-muted">Cargando orden…</p>;

  return (
    <div className="card flex max-w-2xl flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Tu orden</h1>
        <StatusBadge status={order.status} />
      </div>
      {order.status === "PENDING" && (
        <p className="text-sm text-muted" role="status">Estamos esperando la confirmación del pago. Esta página se actualiza sola.</p>
      )}
      <ul className="flex flex-col divide-y divide-line text-sm">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-4 py-2">
            <span>{i.quantity} × {i.product?.name ?? "Producto"}</span>
            <span className="text-muted">{formatPrice(i.unitPrice)} c/u</span>
          </li>
        ))}
      </ul>
      <p className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="font-medium">Total</span>
        <span className="text-2xl font-bold">{formatPrice(order.total)}</span>
      </p>
      <Link href="/orders" className="btn btn-secondary w-fit">← Mis órdenes</Link>
    </div>
  );
}
