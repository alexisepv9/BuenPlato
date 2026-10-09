/** Administración de materias primas y recetas; convierte unidades sólo para su presentación y captura. */
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { apiClient, apiErrorMessage } from "../../lib/api";
import { DishImage } from "../../components/DishImage";
import { ProductPhotoEditor } from "../../components/ProductPhotoEditor";
import type { Category, InventoryStatusFilter, Product, Ingredient, Recipe } from "../../types/domain";
import { currency, fieldClass } from "../../lib/presentation";
import { Icon, FloatingAlert, BrandedLoader, PageHeader, StatusPill, MetricCard, Field } from "../../components/ui";

export function readableQuantity(quantity: number, unit: string) {
  if (unit === "G" && quantity >= 1000) return `${quantity / 1000} kg`;
  if (unit === "ML" && quantity >= 1000) return `${quantity / 1000} l`;
  return `${quantity} ${unit === "UNIT" ? "unidades" : unit.toLowerCase()}`;
}

/** Presenta las cantidades almacenadas en unidades cómodas para el usuario. */
export function ingredientInputValue(value: number, baseUnit: string) {
  return baseUnit === "G" || baseUnit === "ML" ? value / 1000 : value;
}

export function ingredientInputUnit(baseUnit: string) {
  return baseUnit === "G" ? "KG" : baseUnit === "ML" ? "L" : "UNIT";
}

/** Imagen opcional con alternativa legible cuando el enlace no está disponible. */
export function IngredientImage({ url, name }: { url?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return <div className="mb-4 grid h-32 place-items-center overflow-hidden rounded-xl bg-[var(--brand-soft)] text-[#b78a61]">
    {url && !failed ? <img src={url} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full w-full object-cover" /> : <div className="text-center"><Icon name="wheat-awn" className="text-3xl" /><span className="mt-2 block text-xs">Sin imagen</span></div>}
  </div>;
}

/** Inventario real de materias primas y consulta de recetas de producción. */
export function RawInventoryView({ ingredients, products, categories, loading, error, success, search, statusFilter, onSearch, onStatus, onChanged }: {
  ingredients: Ingredient[];
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string;
  success: string;
  search: string;
  statusFilter: InventoryStatusFilter;
  onSearch: (value: string) => void;
  onStatus: (value: InventoryStatusFilter) => void;
  onChanged: (message: string, refresh?: boolean) => void;
}) {
  const [section, setSection] = useState<"ingredients" | "recipes">("ingredients");
  const [photoRevision, setPhotoRevision] = useState(0);
  // La fotografía se guarda por separado: no mezcla sus acciones con la receta.
  const [photoRecipe, setPhotoRecipe] = useState<Recipe | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editing, setEditing] = useState<Ingredient | null | "new">(null);
  const [deleting, setDeleting] = useState<Ingredient | null>(null);
  const [actionError, setActionError] = useState("");
  const [editingRecipe, setEditingRecipe] = useState<Recipe | "new" | null>(null);
  const [pendingRecipeProduct, setPendingRecipeProduct] = useState<Product | null>(null);
  const [recipeComponents, setRecipeComponents] = useState<{ ingredientId: number; quantity: number }[]>([]);
  const low = ingredients.filter((item) => item.stockStatus === "LOW_STOCK").length;
  const out = ingredients.filter((item) => item.stockStatus === "OUT_OF_STOCK").length;
  const value = ingredients.reduce((sum, item) => sum + item.stock * item.unitCost, 0);
  const visible = statusFilter ? ingredients.filter((item) => item.stockStatus === statusFilter) : ingredients;
  const preparedWithoutRecipe = products.filter((product) => product.category.slug !== "bebestibles" && !recipes.some((recipe) => recipe.productId === product.id));

  useEffect(() => {
    if (section === "recipes") apiClient.get<Recipe[]>("/recipes").then(({ data }) => setRecipes(data)).catch(error => setActionError(apiErrorMessage(error)));
  }, [section]);

  async function saveIngredient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      sku: String(form.get("sku") ?? ""), name: String(form.get("name") ?? ""),
      imageUrl: String(form.get("imageUrl") ?? "").trim(),
      unit: String(form.get("unit") ?? "G"), stock: Number(form.get("stock")),
      lowStockThreshold: Number(form.get("lowStockThreshold")), unitCost: Number(form.get("unitCost")),
    };
    try {
      setActionError("");
      if (editing === "new") await apiClient.post("/ingredients", payload);
      else await apiClient.put(`/ingredients/${editing?.id}`, payload);
      setEditing(null);
      onChanged(`${payload.name} fue guardado correctamente.`);
    } catch (requestError) { setActionError(apiErrorMessage(requestError)); }
  }

  async function deleteIngredient() {
    if (!deleting) return;
    try {
      setActionError("");
      await apiClient.delete(`/ingredients/${deleting.id}`);
      const name = deleting.name;
      setDeleting(null);
      onChanged(`${name} fue retirado del inventario.`);
    } catch (requestError) {
      setDeleting(null);
      setActionError(apiErrorMessage(requestError));
    }
  }

  function openRecipe(recipe: Recipe | "new", pendingProduct: Product | null = null) {
    setEditingRecipe(recipe);
    setPendingRecipeProduct(pendingProduct);
    setRecipeComponents(recipe === "new" ? [{ ingredientId: ingredients[0]?.id ?? 0, quantity: 1 }] : recipe.ingredients.map((item) => ({ ingredientId: item.ingredientId, quantity: item.quantity })));
  }

  async function saveRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const productName = String(form.get("productName") ?? "").trim();
    const payload = { productName, yieldQuantity: Number(form.get("yieldQuantity")), ingredients: recipeComponents.map((item) => ({ ...item, unit: ingredients.find((ingredient) => ingredient.id === item.ingredientId)?.baseUnit ?? "G" })) };
    try {
      let createdNewProduct = false;
      let productId = editingRecipe === "new" ? pendingRecipeProduct?.id : editingRecipe?.productId;
      // Una preparación nueva crea primero su producto vendible; el usuario nunca
      // necesita conocer ni seleccionar identificadores internos del catálogo.
      if (!productId) {
        const { data: createdProduct } = await apiClient.post<Product>("/products", {
          categoryId: Number(form.get("categoryId")), sku: `PREP-${Date.now()}`,
          name: productName, description: "Preparación elaborada en el local.",
          price: Number(form.get("price")), unit: "PORCION", stock: 0,
          lowStockThreshold: 0, trackStock: true,
        });
        productId = createdProduct.id;
        createdNewProduct = true;
      }
      await apiClient.put(`/products/${productId}/recipe`, payload);
      setEditingRecipe(null);
      setPendingRecipeProduct(null);
      const { data } = await apiClient.get<Recipe[]>("/recipes");
      setRecipes(data);
      onChanged("La preparación y su rendimiento fueron guardados.", createdNewProduct);
    } catch (requestError) { setActionError(apiErrorMessage(requestError)); }
  }


  return <div className="mx-auto max-w-[1380px]">
    <FloatingAlert message={success} tone="success" />
    <FloatingAlert message={actionError} />
    <PageHeader eyebrow="Bodega y producción" title={section === "ingredients" ? "Materias primas" : "Recetas de platos"} description={section === "ingredients" ? "Revisa existencias, actualiza cantidades y configura las alertas de tus ingredientes." : "Define los ingredientes y porciones de cada plato. Gestiona su fotografía por separado."} icon="wheat-awn" actions={<button className="h-11 rounded-xl bg-[var(--brand-primary)] px-4 text-xs font-extrabold text-white" onClick={() => section === "ingredients" ? setEditing("new") : openRecipe("new")}><Icon name="plus" className="mr-2" />{section === "ingredients" ? "Nueva materia prima" : "Nueva preparación"}</button>} />
    <div className="mt-5 flex gap-2 rounded-2xl bg-white p-2 shadow-sm">
      <button onClick={() => setSection("ingredients")} className={`h-10 flex-1 rounded-xl text-xs font-extrabold ${section === "ingredients" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--brand-muted)]"}`}>Materias primas</button>
      <button onClick={() => setSection("recipes")} className={`h-10 flex-1 rounded-xl text-xs font-extrabold ${section === "recipes" ? "bg-[var(--brand-primary)] text-white" : "text-[var(--brand-muted)]"}`}>Recetas de platos</button>
    </div>
    {section === "ingredients" ? <>
      <section className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard icon="wheat-awn" label="Materias primas" value={ingredients.length} helper="Ingredientes activos" tone="green" active={!statusFilter} onClick={() => onStatus("")} />
        <MetricCard icon="sack-dollar" label="Valor de bodega" value={Math.round(value)} helper="Costo del stock" tone="blue" active={false} onClick={() => onStatus("")} />
        <MetricCard icon="triangle-exclamation" label="Stock bajo" value={low} helper="Reponer pronto" tone="amber" active={statusFilter === "LOW_STOCK"} onClick={() => onStatus(statusFilter === "LOW_STOCK" ? "" : "LOW_STOCK")} />
        <MetricCard icon="circle-xmark" label="Agotados" value={out} helper="Sin disponibilidad" tone="red" active={statusFilter === "OUT_OF_STOCK"} onClick={() => onStatus(statusFilter === "OUT_OF_STOCK" ? "" : "OUT_OF_STOCK")} />
      </section>
      <section className="mt-5 overflow-hidden rounded-[24px] border border-white bg-white shadow-sm">
        <div className="p-4"><input className={fieldClass} type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar arroz, aceite, carne o SKU" /></div>
        {loading ? <BrandedLoader label="Actualizando bodega" /> : error ? <p className="p-5 text-xs text-red-700">{error}</p> : <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <article key={item.id} className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-4">
          <IngredientImage url={item.imageUrl} name={item.name} />
          <div className="flex items-start justify-between"><div><span className="text-[9px] font-bold text-[#a17b55]">{item.sku}</span><h3 className="mt-1 text-sm font-extrabold">{item.name}</h3></div><StatusPill status={item.stockStatus} /></div>
          <strong className="mt-5 block text-2xl text-[var(--brand-secondary)]">{readableQuantity(Number(item.stock), item.baseUnit)}</strong>
          <p className="mt-1 text-[10px] text-[var(--brand-muted)]">Alerta: {readableQuantity(Number(item.lowStockThreshold), item.baseUnit)} · Valor {currency.format(item.stock * item.unitCost)}</p>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--brand-border)] pt-4"><button onClick={() => setEditing(item)} className="min-h-11 flex-1 rounded-xl bg-[var(--brand-soft)] px-3 text-xs font-bold"><Icon name="pen" className="mr-2" />Editar datos y stock</button><button onClick={() => setDeleting(item)} className="min-h-11 rounded-xl px-3 text-xs font-bold text-[#b9472e] hover:bg-[#fde9e4]" aria-label={`Retirar ${item.name}`}><Icon name="trash" className="mr-2" />Retirar</button></div>
        </article>)}</div>}
      </section>
    </> : <><div className="mt-5 flex items-center justify-between gap-3"><p className="text-[10px] font-bold text-[var(--brand-muted)]">{preparedWithoutRecipe.length ? `${preparedWithoutRecipe.length} platos pendientes de receta` : "Todos los platos preparados están inventariados"}</p></div>{preparedWithoutRecipe.length > 0 && <section className="mt-3 grid gap-3 md:grid-cols-2">{preparedWithoutRecipe.map((product) => <button key={product.id} onClick={() => openRecipe("new", product)} className="rounded-2xl border border-[#f0cfa7] bg-[#fff7e8] p-4 text-left"><span className="text-[9px] font-extrabold uppercase text-[#b16b17]">Receta pendiente</span><strong className="mt-1 block text-sm">{product.name}</strong><small className="text-[#817467]">No puede venderse hasta configurar sus ingredientes.</small><span className="mt-3 block text-xs font-extrabold text-[#b16b17]"><Icon name="plus" className="mr-2" />Completar receta</span></button>)}</section>}<section className="mt-3 grid gap-4 lg:grid-cols-2">{recipes.map((recipe) => <article key={recipe.id} className="rounded-[24px] border border-[var(--brand-border)] bg-white p-5 shadow-sm">
      {/* Misma fuente local que las opciones del punto de venta; no consulta proveedores externos. */}
      <DishImage key={`${recipe.productId}-${photoRevision}`} productId={recipe.productId} name={recipe.productName} source={`/api/images/demo/${products.find(product => product.id === recipe.productId)?.category.slug === "postres" ? "fruit" : "food"}`} />
      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--brand-primary)]">Receta de producción</span><h2 className="mt-1 text-lg font-extrabold">{recipe.productName}</h2>
      <div className="mt-3 flex gap-2 text-[10px]"><span className="rounded-lg bg-[var(--brand-soft)] px-2 py-1">Rinde {recipe.yieldQuantity} porciones</span><span className="rounded-lg bg-[#edf5eb] px-2 py-1">Costo {currency.format(recipe.costPerPortion)} / porción</span></div>
      <div className="mt-4 space-y-2">{recipe.ingredients.map((component) => <div key={component.ingredientId} className="flex justify-between border-b border-[#f0ebe3] py-2 text-xs"><span>{component.ingredientName}</span><strong>{readableQuantity(component.quantity, component.baseUnit)}</strong></div>)}</div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--brand-border)] pt-4">
        <button onClick={() => openRecipe(recipe)} className="min-h-11 flex-1 rounded-xl bg-[var(--brand-soft)] px-3 text-xs font-bold"><Icon name="pen" className="mr-2" />Editar receta</button>
        <button onClick={() => setPhotoRecipe(recipe)} className="min-h-11 rounded-xl border border-[var(--brand-border)] px-4 text-xs font-bold"><Icon name="camera" className="mr-2" />Cambiar foto</button>
      </div>
    </article>)}</section></>}
    {editing && <div className="fixed inset-0 z-50 grid place-items-end bg-black/35 sm:place-items-center sm:p-5"><form onSubmit={saveIngredient} className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
      <div className="flex justify-between"><div><span className="text-[9px] font-bold uppercase text-[var(--brand-primary)]">Bodega</span><h2 className="text-lg font-extrabold">{editing === "new" ? "Nueva materia prima" : "Editar materia prima"}</h2></div><button type="button" onClick={() => setEditing(null)}><Icon name="xmark" /></button></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><Field label="Nombre"><input className={fieldClass} name="name" required defaultValue={editing === "new" ? "" : editing.name} /></Field><Field label="SKU"><input className={fieldClass} name="sku" required defaultValue={editing === "new" ? "" : editing.sku} /></Field>
      {editing === "new" ? <Field label="Unidad de ingreso"><select className={fieldClass} name="unit" defaultValue="KG"><option value="KG">Kilogramos</option><option value="G">Gramos</option><option value="L">Litros</option><option value="ML">Mililitros</option><option value="UNIT">Unidades</option></select></Field> : <Field label="Unidad para actualizar"><div className={`${fieldClass} flex items-center bg-[var(--brand-soft)] font-bold`}>{editing.baseUnit === "G" ? "Kilogramos" : editing.baseUnit === "ML" ? "Litros" : "Unidades"}</div><input type="hidden" name="unit" value={ingredientInputUnit(editing.baseUnit)} /></Field>}
      <Field label={editing === "new" ? "Existencia inicial" : "Existencia actual (puedes modificarla)"}><input className={fieldClass} name="stock" type="number" min="0" step="0.001" required defaultValue={editing === "new" ? 0 : ingredientInputValue(editing.stock, editing.baseUnit)} /></Field><Field label="Nivel para alertar stock bajo"><input className={fieldClass} name="lowStockThreshold" type="number" min="0" step="0.001" required defaultValue={editing === "new" ? 0 : ingredientInputValue(editing.lowStockThreshold, editing.baseUnit)} /></Field><Field label={`Costo por ${editing !== "new" && editing.baseUnit === "UNIT" ? "unidad" : editing !== "new" && editing.baseUnit === "ML" ? "litro" : "kilogramo/unidad seleccionada"}`}><input className={fieldClass} name="unitCost" type="number" min="0" step="0.0001" required defaultValue={editing === "new" ? 0 : (editing.baseUnit === "G" || editing.baseUnit === "ML" ? editing.unitCost * 1000 : editing.unitCost)} /></Field></div>
      {editing !== "new" && <p className="mt-3 rounded-xl bg-[#fff6e7] px-3 py-2 text-[10px] leading-4 text-[#80633d]"><Icon name="circle-info" className="mr-2" />Modifica la existencia actual y confirma con el botón inferior. Por ejemplo, 10 kg reemplaza el stock actual por 10 kg.</p>}
      <Field label="Enlace HTTPS de la imagen (opcional)" className="mt-4"><input className={fieldClass} name="imageUrl" type="url" pattern="https://.*" maxLength={2048} placeholder="https://ejemplo.cl/arroz.jpg" defaultValue={editing === "new" ? "" : editing.imageUrl ?? ""} /></Field>
      <p className="mt-2 text-xs text-muted">Pega el enlace directo a una foto. Deja el campo vacío para quitarla.</p>
      <div className="sticky bottom-0 mt-5 flex gap-3 border-t border-[var(--brand-border)] bg-white py-3"><button type="button" onClick={() => setEditing(null)} className="h-12 rounded-xl border border-[var(--brand-border)] px-5 text-xs font-bold">Cancelar</button><button className="h-12 flex-1 rounded-xl bg-[var(--brand-primary)] text-xs font-extrabold text-white">{editing === "new" ? "Crear materia prima" : "Guardar cambios"}</button></div>
    </form></div>}
    {deleting && <div className="fixed inset-0 z-[55] grid place-items-end bg-black/40 sm:place-items-center sm:p-5"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"><div className="grid size-11 place-items-center rounded-2xl bg-[#fde9e4] text-[#b9472e]"><Icon name="trash" /></div><h2 className="mt-4 text-lg font-extrabold">¿Retirar {deleting.name}?</h2><p className="mt-2 text-xs leading-5 text-[#737d77]">Dejará de aparecer en el inventario. Su historial se conservará. Si está incluida en una receta, primero tendrás que modificar esa preparación.</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setDeleting(null)} className="h-11 rounded-xl border border-[#dedbd5] text-xs font-bold">Cancelar</button><button type="button" onClick={deleteIngredient} className="h-11 rounded-xl bg-[#c94c30] text-xs font-extrabold text-white">Sí, retirar</button></div></div></div>}
    {editingRecipe && <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center sm:p-5"><form onSubmit={saveRecipe} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl">
      <div className="flex justify-between"><div><span className="text-[9px] font-bold uppercase text-[var(--brand-primary)]">Producción</span><h2 className="text-lg font-extrabold">{editingRecipe === "new" ? "Nueva preparación" : `Ajustar ${editingRecipe.productName}`}</h2></div><button type="button" onClick={() => { setEditingRecipe(null); setPendingRecipeProduct(null); }}><Icon name="xmark" /></button></div>
      {editingRecipe === "new" && <p className="mt-3 text-xs text-muted">Primero guarda la receta. Después utiliza «Cambiar foto» en la tarjeta del plato.</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Nombre de la preparación"><input className={fieldClass} name="productName" required placeholder="Ej.: Puré de papas casero" defaultValue={editingRecipe === "new" ? pendingRecipeProduct?.name ?? "" : editingRecipe.productName} readOnly={Boolean(pendingRecipeProduct)} /></Field>
        {editingRecipe === "new" && !pendingRecipeProduct && <><Field label="Categoría de venta"><select className={fieldClass} name="categoryId" required defaultValue=""><option value="">Seleccionar categoría</option>{categories.filter((category) => category.slug !== "bebestibles").map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field><Field label="Precio de venta por porción"><input className={fieldClass} name="price" type="number" min="0" step="1" required defaultValue={0} /></Field></>}
        <Field label="Porciones que rinde esta receta"><input className={fieldClass} name="yieldQuantity" type="number" min="0.001" step="0.001" required defaultValue={editingRecipe === "new" ? 1 : editingRecipe.yieldQuantity} /></Field>
      </div>
      <div className="mt-5 space-y-3">{recipeComponents.map((component, index) => <div key={index} className="grid grid-cols-[1fr_110px_36px] gap-2"><select className={fieldClass} value={component.ingredientId} onChange={(event) => setRecipeComponents((items) => items.map((item, position) => position === index ? { ...item, ingredientId: Number(event.target.value) } : item))}>{ingredients.map((ingredient) => <option key={ingredient.id} value={ingredient.id}>{ingredient.name} ({ingredient.baseUnit.toLowerCase()})</option>)}</select><input className={fieldClass} type="number" min="0.001" step="0.001" value={component.quantity} onChange={(event) => setRecipeComponents((items) => items.map((item, position) => position === index ? { ...item, quantity: Number(event.target.value) } : item))} /><button type="button" aria-label="Quitar ingrediente" onClick={() => setRecipeComponents((items) => items.filter((_, position) => position !== index))}><Icon name="trash" /></button></div>)}</div>
      <button type="button" onClick={() => setRecipeComponents((items) => [...items, { ingredientId: ingredients[0]?.id ?? 0, quantity: 1 }])} className="mt-3 h-9 rounded-xl bg-[var(--brand-soft)] px-3 text-[10px] font-bold"><Icon name="plus" className="mr-2" />Agregar ingrediente</button>
      <div className="sticky bottom-0 mt-5 flex gap-3 border-t border-[var(--brand-border)] bg-white py-3">
        <button type="button" onClick={() => { setEditingRecipe(null); setPendingRecipeProduct(null); }} className="h-12 rounded-xl border border-[var(--brand-border)] px-5 text-xs font-bold">Cancelar</button>
        <button disabled={!recipeComponents.length} className="h-12 flex-1 rounded-xl bg-[var(--brand-primary)] text-xs font-extrabold text-white disabled:opacity-40">Guardar receta</button>
      </div>
    </form></div>}
    {photoRecipe && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-label={`Foto de ${photoRecipe.productName}`} className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-[var(--brand-primary)]">Fotografía del plato</p><h2 className="text-lg font-extrabold">{photoRecipe.productName}</h2></div><button className="size-11 rounded-xl bg-[var(--brand-soft)]" aria-label="Cerrar fotografía" onClick={() => setPhotoRecipe(null)}><Icon name="xmark" /></button></div>
      <ProductPhotoEditor key={photoRecipe.productId} productId={photoRecipe.productId} onSaved={() => { setPhotoRevision(value => value + 1); setPhotoRecipe(null); onChanged("La fotografía del plato fue actualizada."); }} />
      <button onClick={() => setPhotoRecipe(null)} className="mt-4 h-11 w-full rounded-xl border border-[var(--brand-border)] text-xs font-bold">Volver a recetas</button>
    </section></div>}
  </div>;
}
