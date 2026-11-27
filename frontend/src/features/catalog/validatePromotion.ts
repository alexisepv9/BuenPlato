/** Valida datos de negocio antes de enviarlos. La API repite las comprobaciones como autoridad final. */
export function validatePromotion(draft: {
  name: string; basePrice: number; availableFrom: string | null; availableTo: string | null;
  sections: { categoryId: number; minimum: number; included: number; options: { productId: number; extraPrice: number }[] }[];
}): string {
  if (!draft.name.trim()) return "Escribe el nombre de la promoción.";
  if (!Number.isInteger(draft.basePrice) || draft.basePrice < 0 || draft.basePrice > 10000000) return "El precio debe ser un número entero entre $0 y $10.000.000.";
  if (draft.availableFrom && draft.availableTo && draft.availableTo < draft.availableFrom) return "La fecha final debe ser igual o posterior a la fecha inicial.";
  if (!draft.sections.length) return "Pulsa «Agregar productos» y selecciona los productos de la promoción.";
  if (draft.sections.length > 20) return "Una promoción admite hasta 20 grupos de productos.";
  const categories = new Set<number>();
  for (const [index, group] of draft.sections.entries()) {
    const prefix = `Grupo de productos ${index + 1}: `;
    if (!group.categoryId) return prefix + "selecciona una categoría.";
    if (categories.has(group.categoryId)) return prefix + "la categoría está repetida; reúne sus productos en un solo grupo.";
    categories.add(group.categoryId);
    if (!Number.isInteger(group.included) || group.included < 1 || group.included > 100) return prefix + "la cantidad debe ser un entero entre 1 y 100.";
    if (!Number.isInteger(group.minimum) || group.minimum < 0 || group.minimum > group.included) return prefix + "revisa la cantidad por oferta.";
    if (!group.options.length) return prefix + "marca al menos un producto.";
    if (group.options.length > 100) return prefix + "puedes elegir hasta 100 productos.";
    if (group.options.some(option => !Number.isInteger(option.extraPrice) || option.extraPrice < 0 || option.extraPrice > 10000000)) return prefix + "cada recargo debe ser un entero entre $0 y $10.000.000.";
  }
  if (draft.sections.every(group => group.minimum === 0)) return "Al menos un grupo debe ser obligatorio. Desmarca «El cliente puede omitir estos productos» en uno de los grupos.";
  return "";
}
