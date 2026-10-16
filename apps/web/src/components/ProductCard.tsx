import Link from "next/link";
import { formatPrice, type Product } from "@/lib/api";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-200 p-3 transition hover:shadow-md dark:border-zinc-800"
    >
      <ProductImage
        src={product.imageUrl}
        alt={product.name}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
      />
      <div>
        <h2 className="font-medium group-hover:underline">{product.name}</h2>
        <p className="text-lg font-semibold">{formatPrice(product.price)}</p>
        {product.stock === 0 && <p className="text-sm text-red-600">Sin stock</p>}
      </div>
    </Link>
  );
}
