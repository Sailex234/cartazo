import Link from "next/link";
import { formatPrice, type Product } from "@/lib/api";
import { ProductImage } from "./ProductImage";

const LOW_STOCK = 5;

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock === 0;
  return (
    <Link
      href={`/products/${product.id}`}
      className="card group flex h-full flex-col gap-3 p-3 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
        {soldOut && (
          <span className="badge absolute left-2 top-2 bg-surface text-danger shadow-sm">Sin stock</span>
        )}
        {!soldOut && product.stock <= LOW_STOCK && (
          <span className="badge absolute left-2 top-2 bg-surface shadow-sm">¡Últimas {product.stock}!</span>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-1 px-1 pb-1">
        <h2 className="line-clamp-2 text-sm font-medium group-hover:text-brand">{product.name}</h2>
        <p className="text-lg font-semibold">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
