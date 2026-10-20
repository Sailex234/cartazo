"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice, getCategories, getProducts, type Category, type Paginated, type Product } from "@/lib/api";

const LIMIT = 20;
const LOW_STOCK = 5;

export function AdminProductTable() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Product> | null>(null);
  const [categories, setCategories] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then((list: Category[]) => setCategories(new Map(list.map((c) => [c.id, c.name]))))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    getProducts({ page, limit: LIMIT }).then(setResult).catch((e) => setError(e.message));
  }, [page]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!result) return <p>Cargando productos…</p>;

  const pages = Math.max(1, Math.ceil(result.meta.total / LIMIT));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm">{result.meta.total} producto(s)</p>
        <Link href="/admin/products/new" className="rounded-md bg-black px-3 py-1.5 text-sm text-white dark:bg-white dark:text-black">
          Nuevo producto
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="py-2 pr-4">Producto</th>
              <th className="py-2 pr-4">Categoría</th>
              <th className="py-2 pr-4 text-right">Precio</th>
              <th className="py-2 pr-4 text-right">Stock</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {result.data.map((p) => (
              <tr key={p.id}>
                <td className="py-2 pr-4">
                  <Link href={`/products/${p.id}`} className="hover:underline">{p.name}</Link>
                </td>
                <td className="py-2 pr-4">{categories.get(p.categoryId) ?? "—"}</td>
                <td className="py-2 pr-4 text-right">{formatPrice(p.price)}</td>
                <td className={`py-2 pr-4 text-right ${p.stock <= LOW_STOCK ? "font-semibold text-red-600" : ""}`}>
                  {p.stock === 0 ? "Sin stock" : p.stock}
                </td>
                <td className="py-2 text-right">
                  <Link href={`/admin/products/${p.id}/edit`} className="underline">Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="underline disabled:opacity-40">Anterior</button>
          <span>Página {page} de {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="underline disabled:opacity-40">Siguiente</button>
        </div>
      )}
    </div>
  );
}
