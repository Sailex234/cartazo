import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

// Los filtros son un <form method="get">: el estado vive en la URL (compartible,
// funciona sin JS) y esta página, Server Component, lo lee de searchParams.
export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) || undefined;
  const num = (k: string) => (one(k) !== undefined ? Number(one(k)) : undefined);

  const page = num("page") ?? 1;
  const filters = {
    q: one("q"),
    category: one("category"),
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
  };

  const [{ data: products, meta }, categories] = await Promise.all([
    getProducts({ ...filters, page, limit: 12 }),
    getCategories(),
  ]);
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filters, page: p })) if (v !== undefined) params.set(k, String(v));
    return `/?${params}`;
  };

  const input = "rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Catálogo de productos</h1>
      <form method="get" role="search" aria-label="Filtrar productos" className="flex flex-wrap items-end gap-3">
        <input name="q" aria-label="Buscar productos" defaultValue={filters.q} placeholder="Buscar productos…" className={`${input} min-w-56 flex-1`} />
        <select name="category" aria-label="Categoría" defaultValue={filters.category ?? ""} className={input}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="minPrice" aria-label="Precio mínimo" type="number" min={0} defaultValue={filters.minPrice} placeholder="Mín" className={`${input} w-24`} />
        <input name="maxPrice" aria-label="Precio máximo" type="number" min={0} defaultValue={filters.maxPrice} placeholder="Máx" className={`${input} w-24`} />
        <button className="rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black">Filtrar</button>
        <Link href="/" className="py-2 text-sm underline">Limpiar</Link>
      </form>

      {products.length === 0 ? (
        <p className="py-16 text-center text-zinc-500 dark:text-zinc-400">No hay productos que coincidan.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.id}><ProductCard product={p} /></li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-center gap-4">
          {page > 1 && <Link href={pageHref(page - 1)} className="underline">← Anterior</Link>}
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Página {page} de {totalPages}</span>
          {page < totalPages && <Link href={pageHref(page + 1)} className="underline">Siguiente →</Link>}
        </nav>
      )}
    </div>
  );
}
