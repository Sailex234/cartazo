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

  if (error) return <p className="text-danger">{error}</p>;
  if (!result) return <p className="text-muted">Cargando productos…</p>;

  const pages = Math.max(1, Math.ceil(result.meta.total / LIMIT));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">{result.meta.total} producto(s)</p>
        <Link href="/admin/products/new" className="btn btn-primary btn-sm">
          Nuevo producto
        </Link>
      </div>
      <div className="card overflow-x-auto px-4">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line">
            <tr>
              <th scope="col" className="py-3 pr-4 font-medium text-muted">Producto</th>
              <th scope="col" className="py-3 pr-4 font-medium text-muted">Categoría</th>
              <th scope="col" className="py-3 pr-4 text-right font-medium text-muted">Precio</th>
              <th scope="col" className="py-3 pr-4 text-right font-medium text-muted">Stock</th>
              <th scope="col" className="py-2"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
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
        <div className="flex items-center gap-4 text-sm" role="navigation" aria-label="Paginación">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary btn-sm">Anterior</button>
          <span>Página {page} de {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="btn btn-secondary btn-sm">Siguiente</button>
        </div>
      )}
    </div>
  );
}
