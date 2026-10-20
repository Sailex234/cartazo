"use client";

import { useEffect, useState } from "react";
import { createCategorySchema } from "@cartazo/shared";
import { ApiError, createCategory, getCategories, type Category } from "@/lib/api";
import { AdminCategoryRow } from "./AdminCategoryRow";

const input = "rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

// "Café en grano" -> "cafe-en-grano": sin tildes, minúsculas, separado por guiones.
const slugify = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Subirlo vuelve a pedir la lista (misma idea que en la tabla de productos).
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  useEffect(() => {
    getCategories().then(setCategories).catch((e) => setError(e.message));
  }, [version]);

  async function onCreate(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    // Slug vacío: se deriva del nombre.
    if (!data.slug?.trim()) data.slug = slugify(data.name ?? "");

    const parsed = createCategorySchema.safeParse(data);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return setFormError(`${String(issue.path[0])}: ${issue.message}`);
    }

    setPending(true);
    try {
      await createCategory(parsed.data);
      form.reset();
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
    } finally {
      setPending(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!categories) return <p>Cargando categorías…</p>;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onCreate} className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input name="name" placeholder="Nombre" className={input} />
          <input name="slug" placeholder="slug (opcional)" className={input} />
          <button
            disabled={pending}
            className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {pending ? "Creando…" : "Nueva categoría"}
          </button>
        </div>
        {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
      </form>

      {categories.length === 0 ? (
        <p>Todavía no hay categorías.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="py-2 pr-4">Nombre</th>
              <th className="py-2 pr-4">Slug</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {categories.map((c) => (
              <AdminCategoryRow key={c.id} category={c} onChanged={reload} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
