/** Administración de ofertas configurables: precio, vigencia, secciones y foto local; no inventa stock. */
import { useEffect, useState, type FormEvent } from "react";
import { apiClient, apiErrorMessage } from "../../lib/api";
import { currency, fieldClass } from "../../lib/presentation";
import type { Category, SalesCatalog, SaleProduct } from "../../types/domain";
import { FloatingAlert, BrandedLoader, Field } from "../../components/ui";
import { LocalPhotoField } from "../../components/LocalPhotoField";

type Option = { productId: number; extraPrice: number };
type Section = { categoryId: number; label: string; minimum: number; included: number; options: Option[] };
type Configuration = { name: string; description: string; kind: "COLACION" | "PROMOTION"; basePrice: number; availableFrom: string | null; availableTo: string | null; active: boolean; revision: number; sections: Section[] };
type Entry = { id: number; configuration: Configuration };
const blank = (): Configuration => ({ name: "", description: "", kind: "PROMOTION", basePrice: 0, availableFrom: null, availableTo: null, active: true, revision: 0, sections: [] });
const button = "min-h-11 rounded-xl bg-[var(--brand-primary)] px-4 text-sm font-bold text-white disabled:opacity-40";

/** Carga el catálogo sin filtros del inventario y conserva el formulario si una petición falla. */
export function PromotionManager({ categories }: { categories: Category[] }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [draft, setDraft] = useState<Configuration | null>(null);
  const [id, setId] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<Entry | null>(null);
  async function load() {
    const [offers, catalog] = await Promise.all([apiClient.get<Entry[]>("/menu-configurations"), apiClient.get<SalesCatalog>("/sales/catalog")]);
    setEntries(offers.data); setProducts(catalog.data.additionalProducts);
    return offers.data;
  }
  useEffect(() => { void load().catch(e => setError(apiErrorMessage(e))).finally(() => setLoading(false)); }, []);
  function edit(entry?: Entry) { setId(entry?.id ?? null); setDraft(entry ? structuredClone(entry.configuration) : blank()); setPhoto(null); setError(""); setSuccess(""); }
  function sectionChange(index: number, update: Partial<Section>) { setDraft(current => current && ({ ...current, sections: current.sections.map((s,i) => i===index ? { ...s,...update } : s) })); }

  /** Primero guarda datos; si falla la foto conserva el ID para reintentar sin duplicar la oferta. */
  async function save(event: FormEvent) {
    event.preventDefault(); if (!draft || saving) return;
    setSaving(true); setError("");
    let stored = false;
    try {
      const response = id ? await apiClient.put<{id:number}>(`/menu-configurations/${id}`,draft) : await apiClient.post<{id:number}>("/menu-configurations",draft);
      const savedId = response.data.id; stored = true; setId(savedId);
      setDraft({ ...draft, revision: id ? draft.revision+1 : 0 });
      if (photo) { const form = new FormData(); form.append("file",photo); await apiClient.post(`/menus/${savedId}/photo`,form); }
      setDraft(null); setPhoto(null); setSuccess("Oferta guardada. Estará en Ventas cuando esté activa y vigente.");
      await load();
    } catch (e) { setError(`${stored ? "Los datos se guardaron. Revisa la foto o recarga la lista antes de reintentar. " : ""}${apiErrorMessage(e)}`); }
    finally { setSaving(false); }
  }
  async function deactivate() {
    if (!removing || saving) return; setSaving(true); setError("");
    try { await apiClient.delete(`/menu-configurations/${removing.id}`); setRemoving(null); await load(); setSuccess("Oferta desactivada; el historial se conserva."); }
    catch(e) { setError(apiErrorMessage(e)); } finally { setSaving(false); }
  }
  return <section className="rounded-3xl border border-[var(--brand-border)] bg-white p-5">
    <FloatingAlert message={error} /><FloatingAlert message={success} tone="success" />
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-extrabold">Colaciones y promociones</h1><p className="mt-1 text-sm text-[var(--brand-muted)]">Combina productos y define qué puede elegir el cliente.</p></div><button className={button} onClick={() => edit()}>Crear oferta</button></div>
    {loading ? <BrandedLoader label="Cargando ofertas" /> : <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{entries.map(entry => <article key={entry.id} className="rounded-2xl border border-[var(--brand-border)] p-4"><span className="text-xs text-[var(--brand-muted)]">{entry.configuration.kind === "PROMOTION" ? "Promoción" : "Colación"} · {entry.configuration.active ? "Activa" : "Inactiva"}</span><h2 className="mt-2 font-bold">{entry.configuration.name}</h2><p>{currency.format(entry.configuration.basePrice)}</p><p className="mt-1 text-xs">{entry.configuration.availableFrom || "Sin fecha inicial"} — {entry.configuration.availableTo || "Sin fecha final"}</p><div className="mt-3 flex flex-wrap gap-2"><button className={button} onClick={() => edit(entry)}>Editar</button>{entry.configuration.active && <button className="min-h-11 rounded-xl border px-3 text-sm" onClick={() => setRemoving(entry)}>Desactivar</button>}</div></article>)}</div>}
    {!loading && !entries.length && <p className="py-6">Crea tu primera promoción, por ejemplo dos completos y una bebida.</p>}
    {draft && <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/40 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="offer-title"><form onSubmit={save} className="mx-auto max-w-xl rounded-3xl bg-white p-5 shadow-xl"><div className="flex justify-between gap-3"><h2 id="offer-title" className="text-xl font-bold">{id ? "Editar oferta" : "Crear oferta"}</h2><button type="button" disabled={saving} className="min-h-11 px-3" onClick={() => setDraft(null)}>Cerrar</button></div>
      <fieldset disabled={saving} className="mt-4 grid gap-4">
        <Field label="Nombre"><input autoFocus required maxLength={120} className={fieldClass} value={draft.name} onChange={e => setDraft({...draft,name:e.target.value})} /></Field>
        <Field label="Tipo"><select className={fieldClass} value={draft.kind} onChange={e => setDraft({...draft,kind:e.target.value as Configuration["kind"]})}><option value="PROMOTION">Promoción</option><option value="COLACION">Colación</option></select></Field>
        <Field label="Descripción"><textarea maxLength={500} className={fieldClass} value={draft.description || ""} onChange={e => setDraft({...draft,description:e.target.value})} /></Field>
        <Field label="Precio base (CLP)"><input required type="number" min="0" max="10000000" step="1" className={fieldClass} value={draft.basePrice} onChange={e => setDraft({...draft,basePrice:Number(e.target.value)})} /></Field>
        <Field label="Disponible desde (opcional)"><input type="date" className={fieldClass} value={draft.availableFrom || ""} onChange={e => setDraft({...draft,availableFrom:e.target.value || null})} /></Field>
        <Field label="Disponible hasta (opcional)"><input type="date" min={draft.availableFrom || undefined} className={fieldClass} value={draft.availableTo || ""} onChange={e => setDraft({...draft,availableTo:e.target.value || null})} /></Field>
        <label className="flex min-h-11 gap-2 items-center"><input type="checkbox" checked={draft.active} onChange={e => setDraft({...draft,active:e.target.checked})} />Activa para venta durante su vigencia</label>
        <LocalPhotoField label="Foto de la oferta" file={photo} onChange={setPhoto} currentUrl={id ? `/api/menus/${id}/photo?revision=${draft.revision}` : undefined} disabled={saving} />
        <div><h3 className="font-bold">Secciones de la oferta</h3><p className="text-xs text-[var(--brand-muted)]">Ejemplo: Completos, mínimo 2 e incluidas 2; Bebidas, mínimo 1 e incluida 1. Una sola opción hace la selección fija; varias permiten elegir. Lo que supere las incluidas se cobra al precio individual.</p></div>
        {draft.sections.map((section,index) => <section key={index} className="grid gap-3 rounded-2xl border border-[var(--brand-border)] p-3">
          <div className="flex justify-between"><h4 className="font-bold">Sección {index+1}</h4><button type="button" className="min-h-11 text-sm" onClick={() => setDraft({...draft,sections:draft.sections.filter((_,i)=>i!==index)})}>Quitar sección</button></div>
          <Field label="Categoría"><select required className={fieldClass} value={section.categoryId || ""} onChange={e => sectionChange(index,{categoryId:Number(e.target.value),options:[]})}><option value="">Seleccionar categoría</option>{categories.filter(c => c.id===section.categoryId || !draft.sections.some(s=>s.categoryId===c.id)).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Título para el cliente"><input required maxLength={100} className={fieldClass} value={section.label} onChange={e => sectionChange(index,{label:e.target.value})} placeholder="Elige tus completos" /></Field>
          <Field label="Cantidad mínima por oferta"><input required type="number" min="0" max={section.included} className={fieldClass} value={section.minimum} onChange={e=>sectionChange(index,{minimum:Number(e.target.value)})} /></Field>
          <Field label="Cantidad incluida en el precio"><input required type="number" min="1" max="100" className={fieldClass} value={section.included} onChange={e=>sectionChange(index,{included:Number(e.target.value)})} /></Field>
          <p className="text-xs">Marca los productos permitidos y su recargo opcional.</p>
          {products.filter(p=>p.categorySlug===categories.find(c=>c.id===section.categoryId)?.slug).map(p=>{
            const option=section.options.find(o=>o.productId===p.id);
            return <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-[var(--brand-background)] p-2"><label className="flex min-h-11 flex-1 items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(option)} onChange={e=>sectionChange(index,{options:e.target.checked ? [...section.options,{productId:p.id,extraPrice:0}] : section.options.filter(o=>o.productId!==p.id)})} />{p.name}</label>{option && <label className="text-xs">Recargo CLP<input aria-label={`Recargo de ${p.name}`} type="number" min="0" max="10000000" required className="ml-2 h-11 w-24 rounded-lg border bg-white px-2" value={option.extraPrice} onChange={e=>sectionChange(index,{options:section.options.map(o=>o.productId===p.id ? {...o,extraPrice:Number(e.target.value)} : o)})} /></label>}</div>;
          })}
          {section.options.some(o=>!products.some(p=>p.id===o.productId)) && <p className="text-xs text-red-700">Hay opciones inactivas. Cambia la categoría y vuelve a seleccionar los productos disponibles.</p>}
        </section>)}
        <button type="button" className="min-h-11 rounded-xl border border-[var(--brand-primary)] text-sm font-bold" onClick={()=>setDraft({...draft,sections:[...draft.sections,{categoryId:0,label:"",minimum:1,included:1,options:[]}]})}>+ Agregar sección</button>
        <p className="text-xs">{draft.kind==="PROMOTION" ? "El precio y los recargos se multiplican por la cantidad de promociones. El stock se descuenta por sus productos, no por una existencia adicional de la promo." : "La colación conserva los recargos por configuración; su cantidad multiplica el precio base y el consumo de productos."}</p>
        <button className={button} disabled={!draft.sections.length || draft.sections.some(s=>!s.options.length)}>{saving ? "Guardando…" : "Guardar oferta"}</button>
      </fieldset>
    </form></div>}
    {removing && <div className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Desactivar oferta"><div className="max-w-sm rounded-3xl bg-white p-6"><h2 className="text-lg font-bold">¿Desactivar {removing.configuration.name}?</h2><p className="my-4 text-sm">Dejará de aparecer en nuevas ventas. Las ventas anteriores se conservan.</p><div className="flex gap-3"><button disabled={saving} className="min-h-11 px-3" onClick={()=>setRemoving(null)}>Cancelar</button><button disabled={saving} className={button} onClick={()=>void deactivate()}>Desactivar</button></div></div></div>}
  </section>;
}
