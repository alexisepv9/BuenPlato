/** Campos de existencias: permite L/mL y kg/g sin alterar la cantidad física ni el costo. */
import { useState } from "react";
import type { Ingredient } from "../../types/domain";
import { Field } from "../../components/ui";
import { fieldClass } from "../../lib/presentation";

const units = [{ value: "KG", label: "Kilogramos (kg)" }, { value: "G", label: "Gramos (g)" }, { value: "L", label: "Litros (L)" }, { value: "ML", label: "Mililitros (mL)" }, { value: "UNIT", label: "Unidades" }];
const factor = (unit: string) => unit === "KG" || unit === "L" ? 1000 : 1;
const family = (unit: string) => ["KG", "G"].includes(unit) ? "G" : ["L", "ML"].includes(unit) ? "ML" : "UNIT";
export function IngredientQuantityFields({ ingredient }: { ingredient: Ingredient | null }) {
  const initial = ingredient?.baseUnit === "ML" ? "L" : ingredient?.baseUnit === "UNIT" ? "UNIT" : "KG";
  const [unit, setUnit] = useState(initial);
  const available = ingredient ? units.filter(item => family(item.value) === ingredient.baseUnit) : units;
  return <>
    <Field label="Unidad de medida"><select className={fieldClass} name="unit" value={unit} onChange={event => {
      const next = event.target.value;
      const form = event.target.form;
      if (form && family(unit) === family(next)) {
        // Convertir también el umbral y el costo evita multiplicar existencias al cambiar la unidad.
        for (const name of ["stock", "lowStockThreshold", "unitCost"]) {
          const input = form.elements.namedItem(name) as HTMLInputElement;
          if (input.value !== "") input.value = String(Number((Number(input.value) * (name === "unitCost" ? factor(next) / factor(unit) : factor(unit) / factor(next))).toFixed(8)));
        }
      }
      setUnit(next);
    }}>{available.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
    <Field label={`Existencia ${ingredient ? "actual" : "inicial"} (${unit === "ML" ? "mL" : unit === "KG" ? "kg" : unit === "G" ? "g" : unit === "UNIT" ? "unidades" : "L"})`}><input className={fieldClass} name="stock" type="number" required min="0" step="any" defaultValue={ingredient ? ingredient.stock / factor(initial) : 0} /></Field>
    <Field label="Alerta de stock (misma unidad)"><input className={fieldClass} name="lowStockThreshold" type="number" required min="0" step="any" defaultValue={ingredient ? ingredient.lowStockThreshold / factor(initial) : 0} /></Field>
    <Field label={`Costo por ${units.find(item => item.value === unit)?.label}`}><input className={fieldClass} name="unitCost" type="number" required min="0" step="any" defaultValue={ingredient ? ingredient.unitCost * factor(initial) : 0} /></Field>
  </>;
}
