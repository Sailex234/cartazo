export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-2 py-32 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Cartazo
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Catálogo en construcción.
        </p>
      </main>
    </div>
  );
}
