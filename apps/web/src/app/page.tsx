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

  const hasFilters = Boolean(filters.q || filters.category || filters.minPrice !== undefined || filters.maxPrice !== undefined);
  const showHero = !hasFilters && page === 1;
  const chip = (active: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
      active ? "border-brand bg-brand text-brand-fg" : "border-line bg-surface hover:bg-surface-muted"
    }`;

  return (
    <div className="flex flex-col gap-8">
      {showHero && (
        <section className="rounded-3xl bg-brand-soft px-6 py-10 text-brand-soft-fg sm:px-10 sm:py-14">
          <h1 className="max-w-xl text-3xl font-bold tracking-tight sm:text-5xl">Todo para tu despensa, en un solo lugar</h1>
          <p className="mt-3 max-w-lg text-base sm:text-lg">
            Almacén, bebidas, lácteos y más. Armá tu carrito y pagá seguro con MercadoPago.
          </p>
          <a href="#catalogo" className="btn btn-primary btn-lg mt-6">Ver productos</a>
        </section>
      )}

      <section id="catalogo" aria-labelledby="catalogo-titulo" className="flex scroll-mt-20 flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="catalogo-titulo" className="text-2xl font-semibold tracking-tight">
            {hasFilters ? "Resultados" : "Catálogo"}
          </h2>
          <p className="text-sm text-muted">{meta.total} producto(s)</p>
        </div>

        <nav aria-label="Categorías" className="flex flex-wrap gap-2">
          <Link href="/" className={chip(!filters.category)}>Todas</Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/?category=${c.id}#catalogo`} className={chip(filters.category === c.id)}>
              {c.name}
            </Link>
          ))}
        </nav>

        <form method="get" role="search" aria-label="Filtrar productos" className="card flex flex-wrap items-end gap-3 p-3">
          {filters.category && <input type="hidden" name="category" value={filters.category} />}
          <input name="q" aria-label="Buscar productos" defaultValue={filters.q} placeholder="Buscar productos…" className="input min-w-48 flex-1" />
          <input name="minPrice" aria-label="Precio mínimo" type="number" min={0} defaultValue={filters.minPrice} placeholder="Mín $" className="input w-28" />
          <input name="maxPrice" aria-label="Precio máximo" type="number" min={0} defaultValue={filters.maxPrice} placeholder="Máx $" className="input w-28" />
          <button className="btn btn-primary">Filtrar</button>
          {hasFilters && <Link href="/" className="btn btn-secondary">Limpiar</Link>}
        </form>

        {products.length === 0 ? (
          <div className="card py-16 text-center">
            <p className="text-lg font-medium">No encontramos productos con esos filtros</p>
            <Link href="/" className="link mt-2 inline-block text-sm">Ver todo el catálogo</Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <li key={p.id}><ProductCard product={p} /></li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav aria-label="Paginación" className="flex items-center justify-center gap-3">
            {page > 1 && <Link href={pageHref(page - 1)} className="btn btn-secondary">← Anterior</Link>}
            <span className="text-sm text-muted">Página {page} de {totalPages}</span>
            {page < totalPages && <Link href={pageHref(page + 1)} className="btn btn-secondary">Siguiente →</Link>}
          </nav>
        )}
      </section>
    </div>
  );
}
