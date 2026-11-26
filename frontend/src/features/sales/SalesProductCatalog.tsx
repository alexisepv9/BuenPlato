/** Catálogo de caja: productos y menús visibles, con filtros locales y cantidades controladas por SalesView. */
import { useState } from "react";
import type { SalesCatalog, SaleProduct } from "../../types/domain";
import { DishImage } from "../../components/DishImage";
import { Icon } from "../../components/ui";
import { currency } from "../../lib/presentation";

/** Filtra sin cambiar el pedido. Las categorías del backend forman secciones automáticamente. */
export function SalesProductCatalog({ catalog, quantities, onMenu, onQuantity }: {
  catalog: SalesCatalog;
  quantities: Record<number, number>;
  onMenu: (id: number) => void;
  onQuantity: (id: number, delta: number, stock: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const categories = [...new Map(catalog.additionalProducts.map(p => [p.categorySlug, p.category])).entries()];
  const matches = (name: string) => name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"));
  const menus = catalog.menus.filter(m => matches(m.name) && (!category || category === (m.kind === "PROMOTION" ? "__promotions" : "__buffet")));
  const menuGroups = [
    { label: "Promociones", menus: menus.filter(m => m.kind === "PROMOTION") },
    { label: "Colación", menus: menus.filter(m => m.kind !== "PROMOTION") },
  ].filter(group => group.menus.length);
  const products = catalog.additionalProducts.filter(p => (!category || category === p.categorySlug) && matches(p.name));
  const sections = categories.map(([slug, name]) => ({ slug, name, products: products.filter(p => p.categorySlug === slug) })).filter(section => section.products.length);

  return <section aria-label="Catálogo de venta" className="rounded-3xl border border-[var(--brand-border)] bg-white p-3 sm:p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-extrabold">1. Elige los productos</h2><p className="text-xs text-[var(--brand-muted)]">Agrega con + o configura una colación. Revisa el pedido y confirma el pago.</p></div>
      <label className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-[var(--brand-border)] px-3 sm:w-64"><Icon name="magnifying-glass" /><input aria-label="Buscar productos y menús" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar producto o menú" className="min-w-0 w-full bg-transparent py-3 text-sm outline-none" /></label>
    </div>
    <div className="mb-4 flex flex-wrap gap-2" aria-label="Categorías">
      {[["", "Todos"], ["__promotions", "Promociones"], ["__buffet", "Colación"], ...categories].map(([key, label]) => <button key={key} aria-pressed={category === key} onClick={() => setCategory(key)} className={`min-h-11 rounded-xl px-3 text-xs font-bold ${category === key ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--brand-background)] text-[var(--brand-ink)]"}`}>{label}</button>)}
    </div>
    {menuGroups.map(group => <section key={group.label} aria-label={group.label} className="mb-7">
    <h3 className="mb-3 border-b border-[var(--brand-border)] pb-2 text-base font-extrabold">{group.label}</h3>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {group.menus.map(menu => <button key={`menu-${menu.id}`} onClick={() => onMenu(menu.id)} className="flex min-w-0 flex-col rounded-2xl border border-[var(--brand-primary)] bg-[var(--brand-soft)] p-2.5 text-left transition hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]">
        <DishImage menuId={menu.id} name={menu.name} source="/api/images/demo/food" square />
        <span className="text-[10px] font-bold uppercase text-[var(--brand-primary)]">{menu.kind === "PROMOTION" ? "Promoción" : "Colación"} · a tu gusto</span>
        <strong className="mt-1 text-sm">{menu.name.replace(/buffet/gi, "Colación")}</strong>
        <span className="mt-2 text-sm font-extrabold">{currency.format(menu.basePrice)}</span>
        <span className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--brand-primary)] px-2 text-xs font-bold text-white">{menu.kind === "PROMOTION" ? "Armar promoción" : "Armar colación"}</span>
      </button>)}
    </div>
    </section>)}
    {sections.map(section => <section key={section.slug} aria-label={section.name} className="mb-7 last:mb-0">
      <h3 className="mb-3 border-b border-[var(--brand-border)] pb-2 text-base font-extrabold">{section.name} <span className="text-xs font-normal text-[var(--brand-muted)]">({section.products.length})</span></h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {section.products.map(product => <SaleProductCard key={product.id} product={product} quantity={quantities[product.id] ?? 0} onQuantity={onQuantity} />)}
      </div>
    </section>)}
    {!menus.length && !products.length && <p role="status" className="py-10 text-center text-sm text-[var(--brand-muted)]">No hay productos para esta búsqueda. Prueba otra categoría o nombre.</p>}
  </section>;
}

/** Tarjeta compacta: conserva foto cuadrada y controles táctiles de 44 px. */
function SaleProductCard({ product, quantity, onQuantity }: { product: SaleProduct; quantity: number; onQuantity: (id: number, delta: number, stock: number) => void }) {
  return <article className={`flex min-w-0 flex-col rounded-2xl border p-2.5 transition ${quantity ? "border-[var(--brand-primary)] bg-[var(--brand-soft)]" : "border-[var(--brand-border)] bg-white"}`}>
    <DishImage productId={product.id} name={product.name} source={`/api/images/demo/${product.categorySlug === "postres" ? "fruit" : "food"}`} square />
    <span className="text-[10px] text-[var(--brand-muted)]">{product.category}</span>
    <h3 className="mt-1 flex-1 text-sm font-bold">{product.name}</h3>
    <strong className="mt-2 text-sm text-[var(--brand-primary)]">{currency.format(product.price)}</strong>
    <div className="mt-3 flex items-center justify-between gap-1">
      <button aria-label={`Quitar ${product.name}`} disabled={!quantity} onClick={() => onQuantity(product.id, -1, product.stock)} className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--brand-border)] bg-white disabled:opacity-30"><Icon name="minus" /></button>
      <output aria-label={`Cantidad de ${product.name}`} className="text-sm font-bold">{quantity}</output>
      <button aria-label={`Agregar ${product.name}`} disabled={quantity >= product.stock} onClick={() => onQuantity(product.id, 1, product.stock)} className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-primary)] text-white disabled:opacity-30"><Icon name="plus" /></button>
    </div>
    {product.stock < 1 && <span className="mt-2 text-xs text-[var(--brand-muted)]">Agotado</span>}
  </article>;
}
