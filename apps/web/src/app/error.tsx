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
    <div role="alert" className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <h1 className="text-lg font-semibold">Algo salió mal</h1>
      <p className="max-w-sm text-sm text-muted">
        No pudimos cargar esta página. Puede ser un problema momentáneo con el servidor.
      </p>
      <button onClick={() => retry()} className="btn btn-primary mt-3">Reintentar</button>
    </div>
  );
}
