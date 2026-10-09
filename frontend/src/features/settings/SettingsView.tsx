/** Editor de identidad con borrador local: nada cambia en otras sesiones hasta guardar. */
import { useEffect, useState, type FormEvent } from "react";
import { useDropzone } from "react-dropzone";
import { apiClient, apiErrorMessage } from "../../lib/api";
import { Field, FloatingAlert, Icon, PageHeader } from "../../components/ui";
import { fieldClass } from "../../lib/presentation";
import { palettes, useBrand, type Brand, type Palette } from "./BrandProvider";

export function SettingsView() {
  const { brand, setBrand, ready, failed } = useBrand();
  const [name, setName] = useState(brand.name);
  const [palette, setPalette] = useState<Palette>(brand.palette);
  const [revision, setRevision] = useState(brand.revision);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [removeLogo, setRemoveLogo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const colors = palettes[palette];
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] }, multiple: false, maxSize: 2 * 1024 * 1024, disabled: busy,
    onDropAccepted: ([image]) => { if (image) { setFile(image); setRemoveLogo(false); setError(""); } },
    onDropRejected: () => setError("Elige un solo logo JPG o PNG de hasta 2 MB."),
  });
  /** Restaura el último estado confirmado; también resuelve un conflicto de versión. */
  function reset() { setName(brand.name); setPalette(brand.palette); setRevision(brand.revision); setFile(null); setRemoveLogo(false); setError(""); }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    const data = new FormData();
    data.append("name", name.trim()); data.append("palette", palette); data.append("revision", String(revision)); data.append("removeLogo", String(removeLogo));
    if (file) data.append("file", file);
    try {
      const { data: saved } = await apiClient.put<Brand>("/branding", data, { headers: { "Content-Type": null } });
      setBrand(saved); setName(saved.name); setRevision(saved.revision); setFile(null); setRemoveLogo(false);
      setSuccess("Configuración guardada. Nombre, logo y colores actualizados en el sistema.");
    } catch (failure) { setError(apiErrorMessage(failure)); }
    finally { setBusy(false); }
  }
  const logo = preview || (!removeLogo && brand.hasLogo ? `/api/branding/logo?v=${brand.revision}` : "");
  return <div className="mx-auto max-w-6xl">
    <PageHeader eyebrow="Administración" title="Identidad del negocio" description="Personaliza el nombre, los colores y el logo que verán todos los usuarios." icon="sliders" />
    <FloatingAlert message={error} /><FloatingAlert message={success} tone="success" />
    <form onSubmit={save} className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
      <fieldset disabled={busy || !ready || failed} className="min-w-0 space-y-5 disabled:opacity-60">
        <section className="rounded-3xl border border-border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">1. Nombre y logo</h2>
          <Field label="Nombre del negocio" className="mt-5"><input required maxLength={80} className={fieldClass} value={name} onChange={event => setName(event.target.value)} placeholder="Ej.: Sabores de casa" /></Field>
          <p className="mt-2 text-xs text-muted">Aparecerá en el acceso, la navegación y el título de la página.</p>
          <div {...getRootProps({ role: "button", "aria-label": "Seleccionar logo", className: `mt-5 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center focus-visible:outline-2 focus-visible:outline-brand ${isDragActive ? "border-brand bg-cream" : "border-border"}` })}>
            <input {...getInputProps()} />
            <Icon name="cloud-arrow-up" className="text-2xl text-brand" /><strong className="mt-3 block text-sm">{file ? file.name : "Seleccionar o arrastrar logo"}</strong>
            <p className="mt-2 text-xs text-muted">JPG o PNG · Hasta 2 MB · Entre 64 y 2048 px por lado.<br />Recomendado: PNG transparente de 512 × 512 px.</p>
          </div>
          {(logo || removeLogo) && <button type="button" onClick={() => { setFile(null); setRemoveLogo(!removeLogo); }} className="mt-3 min-h-11 text-sm font-bold text-brand">{removeLogo ? "Conservar logo actual" : "Quitar logo"}</button>}
        </section>
        <section className="rounded-3xl border border-border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">2. Paleta de colores</h2><p className="mt-2 text-xs text-muted">Colores coordinados para botones, navegación, fondos y formularios. Las alertas mantienen sus colores de seguridad.</p>
          <div className="mt-5 grid grid-cols-2 gap-3" role="group" aria-label="Paleta del negocio">{Object.entries(palettes).map(([key, item]) => <button key={key} type="button" aria-pressed={palette === key} onClick={() => setPalette(key as Palette)} className={`rounded-2xl border-2 p-4 text-left transition ${palette === key ? "border-brand bg-cream" : "border-border"}`}>
            <span className="flex gap-2">{[item.primary, item.secondary, item.background].map(color => <span key={color} className="size-7 rounded-full border border-black/10" style={{ background: color }} />)}</span><strong className="mt-3 block text-sm">{item.label}{palette === key && <Icon name="check" className="ml-2" />}</strong>
          </button>)}</div>
        </section>
        <div className="flex flex-wrap gap-3"><button type="button" onClick={reset} className="min-h-12 rounded-xl border border-border bg-white px-5 text-sm font-bold">Descartar cambios</button><button className="min-h-12 flex-1 rounded-xl bg-brand px-5 text-sm font-bold text-white"><Icon name={busy ? "spinner" : "check"} className={`mr-2 ${busy ? "animate-spin" : ""}`} />{busy ? "Guardando…" : "Guardar configuración"}</button></div>
      </fieldset>
      <aside className="min-w-0 self-start rounded-3xl border border-border bg-white p-5 xl:sticky xl:top-24">
        <h2 className="font-extrabold">Vista previa</h2><p className="mt-1 text-xs text-muted">Solo una demostración: guarda para aplicar a toda la página.</p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-border" style={{ background: colors.background }}>
          <div className="flex items-center gap-3 p-5 text-white" style={{ background: colors.secondary }}><div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/15">{logo ? <img src={logo} alt="Vista previa del logo" className="h-full w-full bg-white object-contain p-1" /> : <Icon name="utensils" />}</div><strong className="break-words">{name || "Nombre del negocio"}</strong></div>
          <div className="p-5"><span className="text-xs font-bold" style={{ color: colors.primary }}>PUNTO DE VENTA</span><h3 className="mt-2 text-xl font-extrabold">Todo listo para atender</h3><div className="my-5 rounded-xl bg-white p-4 text-sm shadow-sm">Menú del día <strong className="float-right">$6.900</strong></div><span className="block rounded-xl p-3 text-center text-sm font-bold text-white" style={{ background: colors.primary }}>Agregar al pedido</span></div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted">Se aplica al login, Venta, Inventario, Finanzas y Configuración. Las demás sesiones se actualizan en un máximo aproximado de 30 segundos o al volver a la ventana.</p>
        {failed && <p role="alert" className="mt-3 text-sm text-red-700">No se pudo cargar la configuración. Espera la reconexión antes de editar.</p>}
        {brand.revision !== revision && <p role="alert" className="mt-3 text-sm text-amber-800">Hay cambios de otro administrador. Pulsa «Descartar cambios» para cargar la versión actual.</p>}
      </aside>
    </form>
  </div>;
}
