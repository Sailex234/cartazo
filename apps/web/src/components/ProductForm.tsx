"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createProductSchema } from "@cartazo/shared";
import { ApiError, createProduct, getCategories, updateProduct, type Category, type Product } from "@/lib/api";

const input = "input";

// Sin `product` crea; con `product` edita. Mismo formulario para los dos casos.
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch((e) => setError(e.message));
  }, []);

  async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data: Record<string, unknown> = Object.fromEntries(new FormData(e.currentTarget));
    // Un input vacío llega como "": el schema espera que imageUrl falte, no que sea "".
    if (data.imageUrl === "") delete data.imageUrl;
    // Precio anterior vacío: al editar se manda null (borra la oferta); al crear, simplemente no va.
    if (data.compareAtPrice === "") {
      if (product) data.compareAtPrice = null;
      else delete data.compareAtPrice;
    }

    // El mismo schema Zod que valida en la API (packages/shared).
    const parsed = createProductSchema.safeParse(data);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(`${String(issue.path[0])}: ${issue.message}`);
      return;
    }

    setPending(true);
    try {
      if (product) await updateProduct(product.id, parsed.data);
      else await createProduct(parsed.data);
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
    } finally {
      setPending(false);
    }
  }

  if (!categories) return <p>{error ? <span className="text-danger">{error}</span> : "Cargando…"}</p>;

  return (
    <form onSubmit={onSubmit} className="card flex w-full max-w-xl flex-col gap-4 p-5 sm:p-6">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nombre
        <input name="name" defaultValue={product?.name} className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Descripción
        <textarea name="description" rows={4} defaultValue={product?.description} className={input} />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Precio (ARS)
          <input name="price" type="number" step="0.01" min="0" defaultValue={product?.price} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Precio anterior (opcional)
          <input name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={product?.compareAtPrice ?? ""} placeholder="Para mostrar oferta" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Stock
          <input name="stock" type="number" step="1" min="0" defaultValue={product?.stock ?? 0} className={input} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Categoría
        <select name="categoryId" defaultValue={product?.categoryId ?? ""} className={input}>
          <option value="" disabled>Elegí una categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        URL de la imagen (opcional)
        <input name="imageUrl" type="url" defaultValue={product?.imageUrl ?? ""} className={input} />
        <span className="text-xs font-normal text-muted">
          Solo se muestran hosts permitidos en <code>next.config.ts</code> (unsplash, picsum).
        </span>
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex items-center gap-4">
        <button
          disabled={pending}
          className="btn btn-primary"
        >
          {pending ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
        </button>
        <Link href="/admin/products" className="btn btn-secondary">Cancelar</Link>
      </div>
    </form>
  );
}
