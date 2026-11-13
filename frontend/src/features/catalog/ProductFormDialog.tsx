/** Formulario único de alta y edición: identidad comercial, inventario y composición opcional. */
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Product, Category, Ingredient, Recipe } from "../../types/domain";
import { apiClient, apiErrorMessage } from "../../lib/api";
import { Field, Icon } from "../../components/ui";
import { SaleUnitSelect } from "../../components/SaleUnitSelect";
import { LocalPhotoField } from "../../components/LocalPhotoField";
import { fieldClass } from "../../lib/presentation";

import { ProductIngredientRow, type ProductIngredient } from "./ProductIngredientRow";
export function ProductFormDialog({ product, composition, categories, ingredients, onClose, onSaved }: {
  product: Product | null; composition?: Recipe; categories: Category[]; ingredients: Ingredient[];
  onClose: () => void; onSaved: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [savedId, setSavedId] = useState(product?.id);
  const [components, setComponents] = useState<ProductIngredient[]>(composition?.ingredients.map(i => ({ ingredientId: i.ingredientId, quantity: i.quantity, unit: i.baseUnit })) ?? []);
  // Preserva productos históricos sin control; añadir ingredientes activa su consumo explícito.
  const mode = components.length ? "COMPOSITION" : product?.trackStock === false ? "NONE" : "PRODUCT";
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, []);

  /** Datos y composición son atómicos; la foto es independiente y conserva el ID para reintentar. */
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const payload = {
        product: {
          categoryId: Number(form.get("categoryId")), name: String(form.get("name")).trim(),
          description: String(form.get("description") ?? ""), price: Number(form.get("price")),
          unit: String(form.get("unit")), stock: Number(form.get("stock") ?? product?.stock ?? 0),
          lowStockThreshold: Number(form.get("threshold") ?? product?.lowStockThreshold ?? 0), trackStock: mode !== "NONE",
        }, mode, yieldQuantity: Number(form.get("yield") ?? 1), ingredients: mode === "COMPOSITION" ? components : [],
      };
      const { data } = await apiClient.request<Product>({ method: savedId ? "put" : "post", url: `/products/configuration${savedId ? `/${savedId}` : ""}`, data: payload });
      setSavedId(data.id);
      if (photo) {
        const body = new FormData(); body.append("file", photo);
        try { await apiClient.post(`/products/${data.id}/photo`, body); }
        catch (failure) { throw new Error(`El producto está guardado, pero la foto no: ${apiErrorMessage(failure)}. Reintenta aquí sin duplicarlo.`); }
      }
      onSaved();
    } catch (failure) { setError(apiErrorMessage(failure)); }
    finally { setBusy(false); }
  }

  return <dialog ref={dialog} aria-labelledby="product-form-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="fixed inset-0 m-auto max-h-[92dvh] w-[calc(100%-1rem)] max-w-xl overflow-y-auto rounded-2xl border border-border bg-white p-0 text-ink shadow-2xl backdrop:bg-black/45">
    <form onSubmit={save} aria-busy={busy}>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white p-5"><div><p className="text-xs font-semibold text-brand">Catálogo</p><h2 id="product-form-title" className="text-xl font-semibold">{product ? "Editar producto" : "Nuevo producto"}</h2></div><button disabled={busy} type="button" aria-label="Cerrar producto" onClick={onClose} className="size-11 rounded-xl bg-cream"><Icon name="xmark" /></button></header>
      <fieldset disabled={busy} className="space-y-5 p-5">
        <div className="grid grid-cols-1 gap-5">
          <LocalPhotoField label="Foto del producto" file={photo} onChange={setPhoto} currentUrl={savedId ? `/api/products/${savedId}/photo` : undefined} fallbackUrl={savedId ? "/api/images/demo/food" : undefined} disabled={busy} />
          <div className="grid gap-3">
            <Field label="Nombre"><input autoFocus className={fieldClass} name="name" defaultValue={product?.name} required maxLength={120} placeholder="Ej.: Bebida, cazuela o galleta" /></Field>
            <Field label="Categoría"><select className={fieldClass} name="categoryId" required defaultValue={product?.category.id ?? ""}><option value="">Seleccionar categoría</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <div className="grid grid-cols-1 gap-3"><Field label="Precio de venta ($)"><input className={fieldClass} name="price" type="number" min="0" step="1" required defaultValue={product?.price ?? 0} /></Field><Field label="Unidad de venta"><SaleUnitSelect currentUnit={product?.unit} /></Field></div>
          </div>
        </div>
        <Field label="Descripción"><textarea className={`${fieldClass} min-h-20 py-3`} name="description" maxLength={500} defaultValue={product?.description} /></Field>
        <div className="grid grid-cols-1 gap-3"><Field label="Stock actual"><input className={fieldClass} name="stock" type="number" min="0" step="0.01" required defaultValue={product?.stock ?? 0} /></Field><Field label="Avisar cuando queden"><input className={fieldClass} name="threshold" type="number" min="0" step="0.01" required defaultValue={product?.lowStockThreshold ?? 0} /></Field></div>
        <p className="text-xs text-muted">{mode === "PRODUCT" ? "La venta descuenta este stock. Se considera agotado cuando llega a cero." : mode === "COMPOSITION" ? "En este modo se descuentan los insumos y se usan sus alertas de stock. El stock y aviso del producto se conservan para la venta sin ingredientes." : "Stock y aviso quedan guardados, pero no se aplican mientras esté desactivado el control."}</p>
        {mode === "NONE" && <p className="rounded-xl bg-cream p-3 text-sm text-muted">Las ventas no descontarán existencias ni insumos.</p>}
        <section className="space-y-3">
          <h3 className="font-semibold">Ingredientes (opcional)</h3>
          <p className="text-sm text-muted">Agrega únicamente los insumos que debe descontar este producto.</p>
          {components.length > 0 && <Field label="Estas cantidades alcanzan para (unidades de venta)"><input className={fieldClass} name="yield" type="number" min="0.001" step="0.001" required defaultValue={composition?.yieldQuantity ?? 1} /></Field>}
          {components.map((item,index) => <ProductIngredientRow key={index} item={item} ingredients={ingredients} index={index} onChange={next => setComponents(items => items.map((value,position) => position===index ? next : value))} onRemove={() => setComponents(items => items.filter((_,position) => position!==index))} />)}
          <button type="button" disabled={!ingredients.length} onClick={() => setComponents(items => [...items,{ ingredientId: 0, quantity: 1, unit: "UNIT" }])} className="min-h-11 rounded-xl bg-cream px-4 text-sm font-semibold disabled:opacity-50"><Icon name="plus" className="mr-2" />Agregar ingrediente</button>
          {!ingredients.length && <p className="text-sm text-muted">Primero registra insumos en la bodega.</p>}
        </section>
      </fieldset>
      {error && <p role="alert" className="mx-5 mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <footer className="sticky bottom-0 flex gap-3 border-t border-border bg-white p-5"><button disabled={busy} type="button" onClick={onClose} className="min-h-12 rounded-xl border border-border px-5">Cancelar</button><button disabled={busy} className="min-h-12 flex-1 rounded-xl bg-brand px-5 font-semibold text-white disabled:opacity-50">{busy ? "Guardando…" : "Guardar producto"}</button></footer>
    </form>
  </dialog>;
}
