"use client";

import Link from "next/link";
import { useState } from "react";
import { updateStockSchema } from "@cartazo/shared";
import { ApiError, deleteProduct, formatPrice, updateProductStock, type Product } from "@/lib/api";

const LOW_STOCK = 5;

type Mode = "view" | "stock" | "confirmDelete";

export function AdminProductRow({
  product,
  categoryName,
  onChanged,
}: {
  product: Product;
  categoryName?: string;
  onChanged: () => void;
}) {
  const [mode, setMode] = useState<Mode>("view");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setError(null);
    setPending(true);
    try {
      await fn();
      setMode("view");
      onChanged();
    } catch (err) {
      // p. ej. 409 al borrar un producto con órdenes: se muestra el mensaje de la API
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
    } finally {
      setPending(false);
    }
  }

  function saveStock(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = updateStockSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    return run(() => updateProductStock(product.id, parsed.data.stock).then(() => undefined));
  }

  return (
    <>
      <tr>
        <td className="py-2 pr-4">
          <Link href={`/products/${product.id}`} className="hover:underline">{product.name}</Link>
        </td>
        <td className="py-2 pr-4">{categoryName ?? "—"}</td>
        <td className="py-2 pr-4 text-right">{formatPrice(product.price)}</td>
        <td className={`py-2 pr-4 text-right ${product.stock <= LOW_STOCK ? "font-semibold text-red-600 dark:text-red-400" : ""}`}>
          {mode === "stock" ? (
            <form onSubmit={saveStock} className="flex items-center justify-end gap-2">
              <input
                name="stock"
                aria-label={`Stock de ${product.name}`}
                type="number"
                min="0"
                step="1"
                defaultValue={product.stock}
                autoFocus
                className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-right font-normal text-foreground dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button disabled={pending} className="underline disabled:opacity-50">Guardar</button>
              <button type="button" onClick={() => setMode("view")} className="underline">Cancelar</button>
            </form>
          ) : (
            <>
              {product.stock === 0 ? "Sin stock" : product.stock}{" "}
              <button onClick={() => setMode("stock")} className="font-normal text-foreground underline">Ajustar</button>
            </>
          )}
        </td>
        <td className="py-2 text-right">
          {mode === "confirmDelete" ? (
            <span className="flex items-center justify-end gap-2">
              ¿Seguro?
              <button
                disabled={pending}
                onClick={() => run(() => deleteProduct(product.id))}
                className="text-red-600 dark:text-red-400 underline disabled:opacity-50"
              >
                Sí, borrar
              </button>
              <button onClick={() => setMode("view")} className="underline">No</button>
            </span>
          ) : (
            <span className="flex items-center justify-end gap-3">
              <Link href={`/admin/products/${product.id}/edit`} className="underline">Editar</Link>
              <button onClick={() => setMode("confirmDelete")} className="text-red-600 dark:text-red-400 underline">Borrar</button>
            </span>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={5} role="alert" className="pb-2 text-sm text-red-600 dark:text-red-400">{error}</td>
        </tr>
      )}
    </>
  );
}
