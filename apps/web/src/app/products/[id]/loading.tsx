export default function Loading() {
  return (
    <div className="grid gap-8 md:grid-cols-2" aria-busy="true" role="status">
      <span className="sr-only">Cargando producto…</span>
      <div className="aspect-square animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      <div className="flex flex-col gap-4">
        <div className="h-9 w-3/4 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-6 w-1/4 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-24 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}
