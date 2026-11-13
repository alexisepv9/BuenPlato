/** Confirmación modal de desactivación con reasignación opcional validada por el servidor. */
import { useEffect, useRef, useState } from "react";
import { apiClient, apiErrorMessage } from "../../lib/api";
import { Field, Icon } from "../../components/ui";
import { fieldClass } from "../../lib/presentation";

type Category = { id: number; name: string };

export function DeactivateIngredientCategoryDialog({ category, categories, onSaved, onClose }: {
  category: Category; categories: Category[];
  onSaved: (items: Category[]) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const [replacement, setReplacement] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /** El foco inicial queda en Cancelar para evitar confirmar accidentalmente. */
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    cancel.current?.focus();
    return () => { element?.close(); previousFocus?.focus(); };
  }, []);

  /** Solo actualiza la tabla cuando la API confirma la reasignación y desactivación. */
  async function deactivate() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { data } = await apiClient.delete<Category[]>(`/ingredients/categories/${category.id}`, {
        params: replacement ? { replacementId: Number(replacement) } : {},
      });
      onSaved(data); onClose();
    } catch (failure) { setError(apiErrorMessage(failure)); }
    finally { setBusy(false); }
  }

  return <dialog ref={dialog} aria-labelledby="deactivate-category-title" aria-describedby="deactivate-category-description"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border border-border bg-white p-0 text-ink shadow-2xl backdrop:bg-black/45">
    <form onSubmit={event => { event.preventDefault(); void deactivate(); }} aria-busy={busy}>
      <header className="flex items-start justify-between gap-3 border-b border-border p-6">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand">Insumos</p><h2 id="deactivate-category-title" className="text-xl font-semibold">Desactivar categoría</h2></div>
        <button type="button" aria-label="Cerrar desactivación" disabled={busy} onClick={onClose} className="size-11 shrink-0 rounded-xl bg-cream disabled:opacity-50"><Icon name="xmark" /></button>
      </header>
      <div className="space-y-4 p-6">
        <p id="deactivate-category-description" className="text-sm text-muted">Vas a desactivar <strong className="break-words text-ink">{category.name}</strong>. Dejará de estar disponible al clasificar insumos. No se elimina el stock ni su historial.</p>
        <Field label="Reasignar insumos a"><select className={fieldClass} value={replacement} onChange={event => setReplacement(event.target.value)} disabled={busy}>
          <option value="">Sin reasignación (solo si está vacía)</option>
          {categories.filter(item => item.id !== category.id).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select></Field>
        <p className="text-xs text-muted">Si tiene insumos asociados, debes seleccionar otra categoría para continuar.</p>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </div>
      <footer className="flex flex-col-reverse gap-3 border-t border-border bg-cream p-5 sm:flex-row sm:justify-end">
        <button ref={cancel} type="button" disabled={busy} onClick={onClose} className="min-h-12 rounded-xl border border-border bg-white px-5 text-sm font-semibold disabled:opacity-50">Cancelar</button>
        <button disabled={busy} className="min-h-12 rounded-xl bg-brand px-5 text-sm font-semibold text-white disabled:opacity-50">{busy && <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" aria-hidden="true" />}{busy ? "Desactivando…" : "Confirmar desactivación"}</button>
      </footer>
    </form>
  </dialog>;
}
