"use client";

import { useState } from "react";
import { createCategorySchema } from "@cartazo/shared";
import { ApiError, deleteCategory, updateCategory, type Category } from "@/lib/api";

const input = "input";

type Mode = "view" | "edit" | "confirmDelete";

export function AdminCategoryRow({ category, onChanged }: { category: Category; onChanged: () => void }) {
  const [mode, setMode] = useState<Mode>("view");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    setPending(true);
    try {
      await fn();
      setMode("view");
      onChanged();
    } catch (err) {
      // p. ej. 409 al borrar una categoría que todavía tiene productos
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
    } finally {
      setPending(false);
    }
  }

  function save(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = createCategorySchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return setError(`${String(issue.path[0])}: ${issue.message}`);
    }
    return run(() => updateCategory(category.id, parsed.data));
  }

  return (
    <>
      <tr>
        {mode === "edit" ? (
          <td colSpan={3} className="py-2">
            <form onSubmit={save} className="flex flex-wrap items-center gap-2">
              <input name="name" aria-label="Nombre" defaultValue={category.name} autoFocus className={`${input} !w-auto`} />
              <input name="slug" aria-label="Slug" defaultValue={category.slug} className={`${input} !w-auto`} />
              <button disabled={pending} className="link disabled:opacity-50">Guardar</button>
              <button type="button" onClick={() => { setError(null); setMode("view"); }} className="link">
                Cancelar
              </button>
            </form>
          </td>
        ) : (
          <>
            <td className="py-2 pr-4">{category.name}</td>
            <td className="py-2 pr-4 text-muted">{category.slug}</td>
            <td className="py-2 text-right">
              {mode === "confirmDelete" ? (
                <span className="flex items-center justify-end gap-2">
                  ¿Seguro?
                  <button
                    disabled={pending}
                    onClick={() => run(() => deleteCategory(category.id))}
                    className="link text-danger disabled:opacity-50"
                  >
                    Sí, borrar
                  </button>
                  <button onClick={() => { setError(null); setMode("view"); }} className="link">No</button>
                </span>
              ) : (
                <span className="flex items-center justify-end gap-3">
                  <button onClick={() => setMode("edit")} className="link">Editar</button>
                  <button onClick={() => setMode("confirmDelete")} className="link text-danger">Borrar</button>
                </span>
              )}
            </td>
          </>
        )}
      </tr>
      {error && (
        <tr>
          <td colSpan={3} role="alert" className="pb-2 text-sm text-danger">{error}</td>
        </tr>
      )}
    </>
  );
}
