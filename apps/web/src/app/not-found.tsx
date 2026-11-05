import Link from "next/link";

// 404 para cualquier URL que no matchea una ruta; se renderiza dentro del layout
// raíz, así que conserva el header. El de products/[id] sigue siendo más específico.
export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">La dirección que buscás no existe o fue movida.</p>
      <Link href="/" className="mt-6 inline-block underline">Volver al catálogo</Link>
    </div>
  );
}
