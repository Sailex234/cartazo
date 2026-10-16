export default function Loading() {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      ))}
    </ul>
  );
}
