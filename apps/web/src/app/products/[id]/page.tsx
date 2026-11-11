import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, getProduct } from "@/lib/api";
import { Price } from "@/components/Price";
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
      <nav aria-label="Ruta" className="text-sm text-muted">
        <Link href="/" className="link">Catálogo</Link> <span aria-hidden>/</span> <span className="text-foreground">{product.name}</span>
      </nav>
      <div className="card grid gap-8 p-4 sm:p-6 md:grid-cols-2">
        <ProductImage src={product.imageUrl} alt={product.name} sizes="(min-width: 768px) 50vw, 100vw" />
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-4xl"><Price value={product.price} /></p>
          <p className="leading-relaxed text-muted">{product.description}</p>
          <p>
            {product.stock === 0 ? (
              <span className="badge badge-danger">Sin stock</span>
            ) : product.stock <= 5 ? (
              <span className="badge">¡Últimas {product.stock} unidades!</span>
            ) : (
              <span className="badge badge-brand">{product.stock} en stock</span>
            )}
          </p>
          <AddToCartButton productId={product.id} disabled={product.stock === 0} />
        </div>
      </div>
    </div>
  );
}
