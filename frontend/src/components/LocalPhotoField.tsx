/** Selector local controlado: prepara una imagen sin enviarla hasta guardar el formulario. */
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Icon } from "./ui";

export function LocalPhotoField({ file, onChange, currentUrl, fallbackUrl, disabled, label = "Foto del insumo" }: { file: File | null; onChange: (file: File | null) => void; currentUrl?: string | null; fallbackUrl?: string; disabled: boolean; label?: string }) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [failedSources, setFailedSources] = useState<string[]>([]);
  useEffect(() => setFailedSources([]), [file, currentUrl, fallbackUrl]);
  // Un archivo recién elegido tiene prioridad; nunca ocultar su fallo con una foto de ejemplo.
  const source = preview || (currentUrl && !failedSources.includes(currentUrl) ? currentUrl : fallbackUrl);
  const visibleSource = source && !failedSources.includes(source) ? source : undefined;
  const isExample = Boolean(visibleSource && visibleSource === fallbackUrl && !preview);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] }, maxSize: 5 * 1024 * 1024, multiple: false, disabled,
    onDropAccepted: ([image]) => { if (image) { onChange(image); setError(""); } },
    onDropRejected: () => setError("Selecciona una sola imagen JPG o PNG de hasta 5 MB."),
  });
  return <section className="mt-5"><h3 className="text-sm font-semibold">{label}</h3>
    <div {...getRootProps({ role: "button", "aria-label": `Seleccionar archivo: ${label}`, className: `mt-2 cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center focus-visible:outline-2 focus-visible:outline-brand ${isDragActive ? "border-brand bg-cream" : "border-border"}` })}>
      <input {...getInputProps()} />
      {/* Reserva siempre el mismo espacio: cargar una foto no mueve ni ensancha los campos. */}
      <div className="mx-auto mb-3 grid size-40 place-items-center overflow-hidden rounded-xl bg-cream sm:size-48">
        {visibleSource ? <img key={visibleSource} src={visibleSource} alt={`Vista previa: ${label}`} onError={() => {
          setFailedSources(items => [...items, visibleSource]);
          if (preview) setError("No se pudo mostrar el archivo seleccionado. Prueba otra imagen JPG o PNG.");
        }} className="block h-full w-full object-contain" /> : <div className="text-center"><Icon name="image" className="text-3xl text-muted" /><p className="mt-2 text-xs">Sin foto disponible</p></div>}
      </div>
      {isExample && <p className="mb-3 text-xs text-muted">Foto de ejemplo local · aún no hay una foto propia</p>}
      <Icon name="cloud-arrow-up" className="mr-2 text-brand" /><span className="text-sm font-semibold">{file ? "Elegir otra foto" : "Seleccionar foto del dispositivo"}</span>
      <p className="mt-2 text-xs text-muted">O arrastra una imagen. JPG/PNG, hasta 5 MB; recomendado 800 × 800 px; entre 640 × 360 y 4096 × 4096 px.</p>
    </div>
    {file && <div className="mt-2 flex items-center gap-3"><span className="min-w-0 flex-1 truncate text-xs">{file.name}</span><button disabled={disabled} type="button" className="min-h-11 text-xs font-semibold text-brand" onClick={() => onChange(null)}>Descartar selección</button></div>}
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </section>;
}
