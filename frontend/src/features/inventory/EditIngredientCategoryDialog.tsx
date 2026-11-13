/** Edición aislada: el diálogo nativo mantiene el foco y bloquea la tabla mientras se edita. */
import { useEffect, useRef, useState } from "react";
import { apiClient, apiErrorMessage } from "../../lib/api";
import { Field, Icon } from "../../components/ui";
import { fieldClass } from "../../lib/presentation";

type Category = { id: number; name: string };

export function EditIngredientCategoryDialog({ category, onSaved, onClose }: {
  category: Category; onSaved: (items: Category[]) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(category.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /** Abre en la capa superior del navegador y restaura el foco al cerrar. */
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    input.current?.focus();
    input.current?.select();
    return () => { dialog.current?.close(); previousFocus?.focus(); };
  }, []);

  /** Conserva la ventana y el borrador si falla la API; cierra solo tras guardar. */
  async function save() {
    if (busy || !name.trim() || name.trim() === category.name) return;
    setBusy(true); setError("");
    try {
      const { data } = await apiClient.put<Category[]>(`/ingredients/categories/${category.id}`, { name: name.trim() });
      onSaved(data);
      onClose();
    } catch (failure) { setError(apiErrorMessage(failure)); }
    finally { setBusy(false); }
  }

  return <dialog ref={dialog} aria-labelledby="edit-category-title" aria-describedby="edit-category-description"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border border-border bg-white p-0 text-ink shadow-2xl backdrop:bg-black/45">
    <form onSubmit={event => { event.preventDefault(); void save(); }} aria-busy={busy}>
      <header className="flex items-start justify-between gap-3 border-b border-border p-6">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand">Insumos</p><h2 id="edit-category-title" className="text-xl font-semibold">Editar categoría</h2></div>
        <button type="button" aria-label="Cerrar edición" disabled={busy} onClick={onClose} className="size-11 shrink-0 rounded-xl bg-cream disabled:opacity-50"><Icon name="xmark" /></button>
      </header>
      <div className="space-y-4 p-6">
        <p id="edit-category-description" className="text-sm text-muted">El nuevo nombre se mostrará en todos los insumos de esta categoría. Sus existencias no cambian.</p>
        <Field label="Nombre de la categoría"><input ref={input} className={fieldClass} value={name} onChange={event => setName(event.target.value)} maxLength={80} required disabled={busy} autoComplete="off" /></Field>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </div>
      <footer className="flex flex-col-reverse gap-3 border-t border-border bg-cream p-5 sm:flex-row sm:justify-end">
        <button type="button" disabled={busy} onClick={onClose} className="min-h-12 rounded-xl border border-border bg-white px-5 text-sm font-semibold disabled:opacity-50">Cancelar</button>
        <button disabled={busy || !name.trim() || name.trim() === category.name} className="min-h-12 rounded-xl bg-brand px-5 text-sm font-semibold text-white disabled:opacity-50">{busy && <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden="true" />}{busy ? "Guardando…" : "Guardar cambios"}</button>
      </footer>
    </form>
  </dialog>;
}
