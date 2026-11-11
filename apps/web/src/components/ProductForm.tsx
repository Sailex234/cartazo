"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createProductSchema } from "@cartazo/shared";
import {
  ApiError,
  createProduct,
  getCategories,
  imageSrc,
  removeProductImage,
  updateProduct,
  uploadProductImage,
  type Category,
  type Product,
} from "@/lib/api";

const input = "input";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

// Sin `product` crea; con `product` edita. Mismo formulario para los dos casos.
export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Foto: archivo elegido (aún sin subir), su vista previa y si se pidió quitar la actual.
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories).catch((e) => setError(e.message));
  }, []);

  async function onSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data: Record<string, unknown> = Object.fromEntries(new FormData(e.currentTarget));
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
      const saved = product ? await updateProduct(product.id, parsed.data) : await createProduct(parsed.data);
      // La foto viaja aparte (multipart): primero se guarda el producto, después se sube o quita.
      try {
        if (file) await uploadProductImage(saved.id, file);
        else if (removeImage) await removeProductImage(saved.id);
      } catch (err) {
        const reason = err instanceof ApiError ? err.message : "error de conexión";
        setError(`El producto se guardó, pero la foto no: ${reason}.`);
        if (!product) router.replace(`/admin/products/${saved.id}/edit`);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
    } finally {
      setPending(false);
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setError(null);
    if (picked && !IMAGE_TYPES.includes(picked.type)) {
      setError("La imagen debe ser JPG, PNG o WebP.");
      e.target.value = "";
      return;
    }
    if (picked && picked.size > MAX_IMAGE_BYTES) {
      setError("La imagen pesa más de 2 MB.");
      e.target.value = "";
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(picked);
    setPreview(picked ? URL.createObjectURL(picked) : null);
    if (picked) setRemoveImage(false);
  }

  const currentImage = imageSrc(product?.imageUrl ?? null);
  const shownImage = preview ?? (removeImage ? null : currentImage);

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
      <div className="flex flex-col gap-2 text-sm font-medium">
        <label htmlFor="image">Imagen (opcional)</label>
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-muted">
            {shownImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa de un blob local, next/image no aplica
              <img src={shownImage} alt="Vista previa de la imagen" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-normal text-muted">Sin imagen</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input id="image" type="file" accept={IMAGE_TYPES.join(",")} onChange={onPickFile} className="text-xs font-normal" />
            {currentImage && !file && (
              <button type="button" onClick={() => setRemoveImage((v) => !v)} className="btn btn-secondary btn-sm w-fit">
                {removeImage ? "Conservar imagen actual" : "Quitar imagen actual"}
              </button>
            )}
            <span className="text-xs font-normal text-muted">JPG, PNG o WebP, hasta 2 MB. Se achica a 800 px automáticamente.</span>
          </div>
        </div>
      </div>
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
