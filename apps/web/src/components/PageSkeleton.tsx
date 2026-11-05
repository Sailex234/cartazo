// Esqueleto genérico para secciones que no son una grilla de productos
// (carrito, órdenes, admin, detalle). El loading.tsx de la raíz es la grilla del
// catálogo, así que sin uno propio esas rutas mostrarían productos mientras cargan.
export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" role="status">
      <span className="sr-only">Cargando…</span>
      <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      ))}
    </div>
  );
}
