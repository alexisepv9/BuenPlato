/** Selector local controlado: prepara una imagen sin enviarla hasta guardar el formulario. */
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Icon } from "./ui";

export function LocalPhotoField({ file, onChange, currentUrl, disabled }: { file: File | null; onChange: (file: File | null) => void; currentUrl?: string | null; disabled: boolean }) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
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
  return <section className="mt-5"><h3 className="text-sm font-semibold">Foto del insumo</h3>
    <div {...getRootProps({ role: "button", "aria-label": "Seleccionar foto local del insumo", className: `mt-2 cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center focus-visible:outline-2 focus-visible:outline-brand ${isDragActive ? "border-brand bg-cream" : "border-border"}` })}>
      <input {...getInputProps()} />
      {(preview || currentUrl) && <img src={preview || currentUrl || ""} alt="Vista previa del insumo" className="mx-auto mb-3 h-32 w-full rounded-xl object-contain" />}
      <Icon name="cloud-arrow-up" className="mr-2 text-brand" /><span className="text-sm font-semibold">{file ? "Elegir otra foto" : "Seleccionar foto del dispositivo"}</span>
      <p className="mt-2 text-xs text-muted">O arrastra una imagen. JPG/PNG, hasta 5 MB; entre 640 × 360 y 4096 × 4096 px.</p>
    </div>
    {file && <div className="mt-2 flex items-center gap-3"><span className="min-w-0 flex-1 truncate text-xs">{file.name}</span><button disabled={disabled} type="button" className="min-h-11 text-xs font-semibold text-brand" onClick={() => onChange(null)}>Descartar selección</button></div>}
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </section>;
}
