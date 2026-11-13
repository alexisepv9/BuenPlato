/** Fila de ingrediente: insumo con su unidad fija, cantidad y acción de quitar. */
import type { Ingredient } from "../../types/domain";
import { fieldClass } from "../../lib/presentation";
import { Icon } from "../../components/ui";

export type ProductIngredient = { ingredientId: number; quantity: number; unit: string };

/** La unidad procede del insumo y no se elige de nuevo en la composición. */
export function ProductIngredientRow({ item, ingredients, index, onChange, onRemove }: {
  item: ProductIngredient; ingredients: Ingredient[]; index: number;
  onChange: (item: ProductIngredient) => void; onRemove: () => void;
}) {
  const selected = ingredients.find(i => i.id === item.ingredientId);
  const unitLabel = (unit: string) => unit === "G" ? "g" : unit === "ML" ? "mL" : unit === "UNIT" ? "unidades" : unit;
  const compact = `${fieldClass} min-w-0 px-2 text-xs`;
  return <div className="grid grid-cols-[minmax(0,1fr)_95px_40px] items-end gap-2 rounded-xl border border-border p-2 sm:grid-cols-[minmax(0,1fr)_125px_44px]">
    <label className="grid min-w-0 gap-1 text-xs text-muted">Insumo<select aria-label={`Insumo ${index+1}`} className={compact} required value={item.ingredientId || ""} onChange={e => {
      const next = ingredients.find(i => i.id === Number(e.target.value));
      if (next) onChange({ ingredientId: next.id, quantity: 1, unit: next.baseUnit });
    }}><option value="">Seleccionar</option>{ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({unitLabel(i.baseUnit)})</option>)}</select></label>
    <label className="grid gap-1 text-xs text-muted">Cantidad{selected ? ` (${unitLabel(item.unit)})` : ""}<input aria-label={`Cantidad ${index+1}`} className={compact} type="number" required min="0.000001" step="any" value={item.quantity} onChange={e => onChange({ ...item, quantity: Number(e.target.value) })} /></label>
    <button type="button" className="h-12 rounded-lg text-red-700" aria-label={`Quitar ingrediente ${index+1}`} onClick={onRemove}><Icon name="trash" /></button>
  </div>;
}
