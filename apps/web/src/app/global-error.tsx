"use client";

// Último recurso: reemplaza el root layout cuando falla el layout mismo, por eso
// trae su propio <html>/<body> y no puede depender de AuthProvider ni del header.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "4rem 1rem" }}>
        <h1>Cartazo no está disponible</h1>
        <p>Ocurrió un error inesperado. Probá de nuevo en unos instantes.</p>
        <button onClick={() => retry()}>Reintentar</button>
      </body>
    </html>
  );
}
