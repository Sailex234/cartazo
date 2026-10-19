import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, formatPrice, getProduct } from "@/lib/api";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductImage } from "@/components/ProductImage";

async function load(id: string) {
  try {
    return await getProduct(id);
  } catch (err) {
    // la API responde 404 (not found) o 400 (id no es uuid): ambos son "no existe" acá
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const product = await load((await params).id);
  return { title: `${product.name} — Cartazo`, description: product.description };
}

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const product = await load((await params).id);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-sm underline">← Volver al catálogo</Link>
      <div className="grid gap-8 md:grid-cols-2">
        <ProductImage src={product.imageUrl} alt={product.name} sizes="(min-width: 768px) 50vw, 100vw" />
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
          <p className="text-zinc-600 dark:text-zinc-400">{product.description}</p>
          <p className={product.stock > 0 ? "text-sm text-green-700" : "text-sm text-red-600"}>
            {product.stock > 0 ? `${product.stock} en stock` : "Sin stock"}
          </p>
          <AddToCartButton productId={product.id} disabled={product.stock === 0} />
        </div>
      </div>
    </div>
  );
}
