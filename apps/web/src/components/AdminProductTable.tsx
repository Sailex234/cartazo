"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategories, getProducts, type Category, type Paginated, type Product } from "@/lib/api";
import { AdminProductRow } from "./AdminProductRow";

const LIMIT = 20;

export function AdminProductTable() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Product> | null>(null);
  const [categories, setCategories] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState<string | null>(null);
  // Subirlo vuelve a pedir la página: la fuente de verdad sigue siendo el servidor.
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    getCategories()
      .then((list: Category[]) => setCategories(new Map(list.map((c) => [c.id, c.name]))))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    getProducts({ page, limit: LIMIT })
      .then((res) => {
        // Se borró el último producto de la página: volver a la anterior.
        if (res.data.length === 0 && page > 1) setPage(page - 1);
        else setResult(res);
      })
      .catch((e) => setError(e.message));
  }, [page, version]);

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
              <AdminProductRow
                key={p.id}
                product={p}
                categoryName={categories.get(p.categoryId)}
                onChanged={reload}
              />
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
