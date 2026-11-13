/** Administración contextual de categorías; no agrega destinos al menú principal. */
import { DeactivateIngredientCategoryDialog } from "./DeactivateIngredientCategoryDialog";
import { EditIngredientCategoryDialog } from "./EditIngredientCategoryDialog";
import { useState } from "react";
import { IngredientCategoriesTable } from "./IngredientCategoriesTable";
import { apiClient, apiErrorMessage } from "../../lib/api";
import { Icon, Field } from "../../components/ui";
import { fieldClass } from "../../lib/presentation";

type Category = { id: number; name: string };
export function IngredientCategoriesDialog({ categories, onChanged, onClose }: {
  categories: Category[]; onChanged: (items: Category[]) => void; onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [removing, setRemoving] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** La lista solo cambia después de la confirmación del servidor. */
  async function save() {
    if (busy || !name.trim()) return;
    setBusy(true); setError("");
    try {
      const result = await apiClient.post<Category[]>("/ingredients/categories", { name: name.trim() });
      onChanged(result.data); setName("");
    } catch (failure) { setError(apiErrorMessage(failure)); }
    finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-3">
    <section role="dialog" aria-modal="true" aria-labelledby="ingredient-categories-title" className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-xl">
      <header className="flex items-start justify-between gap-4"><div><h2 id="ingredient-categories-title" className="text-xl font-semibold">Categorías de insumos</h2><p className="mt-2 text-sm text-muted">Organiza el inventario sin salir de esta pantalla.</p></div><button type="button" disabled={busy} onClick={onClose} aria-label="Cerrar categorías" className="size-11 shrink-0 rounded-xl bg-cream"><Icon name="xmark" /></button></header>
      <form className="my-5 flex items-end gap-2" onSubmit={event => { event.preventDefault(); void save(); }}>
        <Field label="Nueva categoría" className="min-w-0 flex-1"><input className={fieldClass} value={name} onChange={event => setName(event.target.value)} required maxLength={80} disabled={busy} placeholder="Ej.: Bebidas" /></Field>
        <button disabled={busy || !name.trim()} className="h-12 rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50">Crear</button>
      </form>
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <IngredientCategoriesTable categories={categories} busy={busy}
        onEdit={category => { setEditing(category); setRemoving(null); setError(""); }}
        onDeactivate={category => { setRemoving(category); setEditing(null); setError(""); }} />
    </section>
    {removing && <DeactivateIngredientCategoryDialog category={removing} categories={categories} onSaved={onChanged} onClose={() => setRemoving(null)} />}
    {editing && <EditIngredientCategoryDialog category={editing} onSaved={onChanged} onClose={() => setEditing(null)} />}
  </div>;
}
