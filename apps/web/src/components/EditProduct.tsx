"use client";

import { useEffect, useState } from "react";
import { getProduct, type Product } from "@/lib/api";
import { ProductForm } from "./ProductForm";

export function EditProduct({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProduct(id).then(setProduct).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-danger">{error}</p>;
  if (!product) return <p>Cargando producto…</p>;
  return <ProductForm product={product} />;
}
