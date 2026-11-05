"use client";

import { useEffect, useState } from "react";
import { createCategorySchema } from "@cartazo/shared";
import { ApiError, createCategory, getCategories, type Category } from "@/lib/api";
import { AdminCategoryRow } from "./AdminCategoryRow";

const input = "input";

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

  if (error) return <p className="text-danger">{error}</p>;
  if (!categories) return <p className="text-muted">Cargando categorías…</p>;

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onCreate} className="card flex flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input name="name" aria-label="Nombre" placeholder="Nombre" className={`${input} !w-auto min-w-40 flex-1`} />
          <input name="slug" aria-label="Slug (opcional)" placeholder="slug (opcional)" className={`${input} !w-auto min-w-40 flex-1`} />
          <button
            disabled={pending}
            className="btn btn-primary btn-sm"
          >
            {pending ? "Creando…" : "Nueva categoría"}
          </button>
        </div>
        {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
      </form>

      {categories.length === 0 ? (
        <p className="text-muted">Todavía no hay categorías.</p>
      ) : (
        <div className="card overflow-x-auto px-4">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line">
            <tr>
              <th scope="col" className="py-3 pr-4 font-medium text-muted">Nombre</th>
              <th scope="col" className="py-3 pr-4 font-medium text-muted">Slug</th>
              <th scope="col" className="py-2"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {categories.map((c) => (
              <AdminCategoryRow key={c.id} category={c} onChanged={reload} />
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
