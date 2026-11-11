import Link from "next/link";
import type { Product } from "@/lib/api";
import { AddToCartButton } from "./AddToCartButton";
import { OldPrice, Price } from "./Price";
import { ProductImage } from "./ProductImage";

const LOW_STOCK = 5;

// Estructura al estilo supermercado: zona de imagen separada por una línea, nombre,
// precio grande y botón de compra dentro de la propia card.
export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock === 0;
  return (
    <div className="card group flex h-full flex-col overflow-hidden transition hover:shadow-lg">
      <Link href={`/products/${product.id}`} className="flex flex-1 flex-col">
        <div className="relative border-b border-line p-3">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="aspect-[4/3]"
          />
          {soldOut && <span className="badge absolute left-2 top-2 bg-surface text-danger shadow-sm">Sin stock</span>}
          {!soldOut && product.stock <= LOW_STOCK && (
            <span className="badge badge-accent absolute left-2 top-2 shadow-sm">¡Últimas {product.stock}!</span>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-between gap-2 px-3 pt-3">
          <h2 className="line-clamp-2 text-sm group-hover:text-brand">{product.name}</h2>
          <div>
            <OldPrice price={product.price} compareAtPrice={product.compareAtPrice} reserve />
            <p className="text-2xl">
              <Price value={product.price} />
            </p>
          </div>
        </div>
      </Link>
      <div className="p-3">
        <AddToCartButton productId={product.id} disabled={soldOut} compact />
      </div>
    </div>
  );
}
