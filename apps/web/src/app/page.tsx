import Link from "next/link";
import { getProducts } from "@/lib/api";
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

  const { data: products, meta } = await getProducts({ ...filters, page, limit: 12 });
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filters, page: p })) if (v !== undefined) params.set(k, String(v));
    return `/?${params}`;
  };

  const hasFilters = Boolean(filters.q || filters.category || filters.minPrice !== undefined || filters.maxPrice !== undefined);
  const showHero = !hasFilters && page === 1;
  return (
    <div className="flex flex-col gap-6">
      {showHero && (
        <>
          <section className="flex items-center justify-between gap-6 overflow-hidden rounded-xl bg-[linear-gradient(105deg,var(--brand)_0_62%,var(--accent)_62%)] px-6 py-6 text-white sm:px-8">
            <div>
              <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-4xl">Ofertas de la semana</h1>
              <p className="mt-2 max-w-sm text-sm sm:text-base">Almacén, bebidas, lácteos y más. Pagá seguro con MercadoPago.</p>
              <a href="#catalogo" className="btn btn-accent mt-4 shadow-md">Ver productos</a>
            </div>
            <div aria-hidden className="hidden pr-2 text-center text-accent-fg sm:block">
              <div className="text-6xl leading-none">🧺</div>
              <div className="mt-1 text-xl font-black">¡Precios rebajados!</div>
            </div>
          </section>
          <section aria-label="Beneficios" className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Envío a domicilio",
                text: "Coordinás la entrega al pagar",
                icon: <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19.5a1.5 1.5 0 1 0 0-.01M17 19.5a1.5 1.5 0 1 0 0-.01" />,
              },
              {
                title: "Pagá como quieras",
                text: "Tarjetas, débito y dinero en cuenta",
                icon: <path d="M3 6.5h18v11H3zM3 10.5h18M6.5 14.5h4" />,
              },
              {
                title: "Compra protegida",
                text: "Pagos seguros con MercadoPago",
                icon: <path d="M12 3l7.5 3v5.5c0 4.5-3 8-7.5 9.5-4.5-1.500-7.500-5-7.500-9.500V6zM9 12l2.200 2.200L15.500 10" />,
              },
            ].map((b) => (
              <div key={b.title} className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 shadow-sm ring-1 ring-black/5">
                <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {b.icon}
                  </svg>
                </span>
                <div className="text-xs text-muted">
                  <b className="block text-sm text-foreground">{b.title}</b>
                  {b.text}
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      <section id="catalogo" aria-labelledby="catalogo-titulo" className="flex scroll-mt-20 flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="catalogo-titulo" className="flex items-center gap-2 text-2xl font-bold tracking-tight before:h-6 before:w-1.5 before:rounded-sm before:bg-brand before:content-['']">
            {hasFilters ? "Resultados" : "Catálogo"}
          </h2>
          <p className="text-sm text-muted">{meta.total} producto(s)</p>
        </div>

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
