"use client"; // los error boundaries deben ser Client Components

import { useEffect } from "react";

// Se muestra cuando algo lanza mientras se renderiza una página (típicamente la
// API caída o devolviendo 5xx). En producción Next oculta el mensaje real del
// servidor y deja solo `digest` para cruzarlo con los logs.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-16 text-center" role="alert">
      <h1 className="text-2xl font-semibold">Algo salió mal</h1>
      <p className="mt-2 text-zinc-500">
        No pudimos cargar esta página. Puede ser un problema momentáneo con el servidor.
      </p>
      <button
        onClick={() => retry()}
        className="mt-6 rounded-md bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
      >
        Reintentar
      </button>
    </div>
  );
}
