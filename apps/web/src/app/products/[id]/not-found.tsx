import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold">Producto no encontrado</h1>
      <Link href="/" className="mt-4 inline-block underline">Volver al catálogo</Link>
    </div>
  );
}
