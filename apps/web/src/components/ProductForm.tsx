"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createProductSchema } from "@cartazo/shared";
import { ApiError, createProduct, getCategories, updateProduct, type Category, type Product } from "@/lib/api";

const input = "rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

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
    const data = Object.fromEntries(new FormData(e.currentTarget));
    // Un input vacío llega como "": el schema espera que imageUrl falte, no que sea "".
    if (data.imageUrl === "") delete data.imageUrl;

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

  if (!categories) return <p>{error ? <span className="text-red-600 dark:text-red-400">{error}</span> : "Cargando…"}</p>;

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input name="name" defaultValue={product?.name} className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Descripción
        <textarea name="description" rows={4} defaultValue={product?.description} className={input} />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Precio (ARS)
          <input name="price" type="number" step="0.01" min="0" defaultValue={product?.price} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Stock
          <input name="stock" type="number" step="1" min="0" defaultValue={product?.stock ?? 0} className={input} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Categoría
        <select name="categoryId" defaultValue={product?.categoryId ?? ""} className={input}>
          <option value="" disabled>Elegí una categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        URL de la imagen (opcional)
        <input name="imageUrl" type="url" defaultValue={product?.imageUrl ?? ""} className={input} />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Solo se muestran hosts permitidos en <code>next.config.ts</code> (unsplash, picsum).
        </span>
      </label>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex items-center gap-4">
        <button
          disabled={pending}
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
        </button>
        <Link href="/admin/products" className="text-sm underline">Cancelar</Link>
      </div>
    </form>
  );
}
