/** Unidades comerciales compartidas. Describen la venta; no convierten existencias automáticamente. */
import { fieldClass } from "../lib/presentation";

const unitGroups = [
  { label: "Conteo", units: ["unidades", "piezas", "pares", "docenas", "medias docenas", "centenas", "millares"] },
  { label: "Alimentos y porciones", units: ["porciones", "raciones", "platos", "menús", "rebanadas", "trozos", "bolas"] },
  { label: "Envases y presentaciones", units: ["botellas", "latas", "vasos", "tazas", "copas", "jarras", "frascos", "potes", "bolsas", "sobres", "paquetes", "packs", "cajas", "bandejas", "sacos", "bidones", "barriles", "baldes", "rollos", "kits", "juegos", "lotes", "pallets"] },
  { label: "Peso", units: ["miligramos", "gramos", "kilogramos", "toneladas", "libras", "onzas"] },
  { label: "Volumen", units: ["mililitros", "centilitros", "litros", "metros cúbicos"] },
  { label: "Longitud y superficie", units: ["milímetros", "centímetros", "metros", "yardas", "metros cuadrados"] },
  { label: "Servicios y tiempo", units: ["servicios", "sesiones", "horas", "días", "meses"] },
] as const;

/** Preserva valores históricos personalizados: abrir y guardar nunca cambia su unidad implícitamente. */
export function SaleUnitSelect({ currentUnit = "unidades" }: { currentUnit?: string }) {
  const known = unitGroups.some(group => group.units.some(unit => unit === currentUnit));
  return <select className={fieldClass} name="unit" required defaultValue={currentUnit}>
    {!known && <optgroup label="Unidad actual"><option value={currentUnit}>{currentUnit}</option></optgroup>}
    {unitGroups.map(group => <optgroup key={group.label} label={group.label}>
      {group.units.map(unit => <option key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</option>)}
    </optgroup>)}
  </select>;
}
