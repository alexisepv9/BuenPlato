/** Selección con Dropzone, validación y vista previa; guarda en storage al confirmar. */
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Icon } from "./ui";
import { apiClient, apiErrorMessage } from "../lib/api";

export function ProductPhotoEditor({ productId, onSaved }: { productId: number; onSaved: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [validating, setValidating] = useState(false);
  // Dropzone gestiona teclado, selección y arrastre; la API mantiene la validación final.
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] },
    multiple: false, maxSize: 5 * 1024 * 1024, disabled: busy || validating,
    onDropRejected: () => setMessage("Selecciona una sola imagen JPG o PNG de hasta 5 MB."),
    onDropAccepted: async ([candidate]) => {
      if (!candidate) return;
      setValidating(true); setMessage(""); setFile(null);
      try {
        const bitmap = await createImageBitmap(candidate);
        const { width, height } = bitmap; bitmap.close();
        if (width < 640 || height < 360 || width > 4096 || height > 4096) {
          setMessage(`Tu foto mide ${width} × ${height}. Usa entre 640 × 360 y 4096 × 4096 px.`); return;
        }
        setFile(candidate);
        setMessage(`${width} × ${height} px. ${Math.abs(width / height - 16 / 9) > .1 ? "Se recomienda 16:9 para evitar recortes." : "Proporción ideal."}`);
      } catch { setMessage("No se pudo leer esta imagen. Prueba con otra foto."); }
      finally { setValidating(false); }
    },
  });
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function upload() {
    if (!file) return;
    setBusy(true); setMessage("");
    try {
      const data = new FormData(); data.append("file", file);
      // Anula el JSON predeterminado: el navegador debe generar multipart con su boundary.
      await apiClient.post(`/products/${productId}/photo`, data, { headers: { "Content-Type": null } });
      setFile(null); setMessage("Foto guardada. Ya está disponible en recetas y ventas."); onSaved();
    } catch (failure) { setMessage(apiErrorMessage(failure)); }
    finally { setBusy(false); }
  }
  return <section className="mt-4 rounded-xl border border-[var(--brand-border)] p-4">
    <strong className="text-sm">Foto del plato</strong>
    <p className="my-2 text-xs">JPG o PNG, máximo 5 MB. Mínimo 640 × 360 px; máximo 4096 × 4096 px. Ideal: 1280 × 720 (16:9). Otros formatos se recortan visualmente en las tarjetas.</p>
    <div {...getRootProps({ role: "button", "aria-label": "Elegir fotografía del plato", className: `mt-4 cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-primary)] ${isDragActive ? "border-[var(--brand-primary)] bg-[var(--brand-soft)]" : "border-[var(--brand-border)] bg-[var(--brand-background)] hover:border-[var(--brand-primary)]"}` })}>
      <input {...getInputProps()} />
      {preview ? <img src={preview} alt="Vista previa de la foto seleccionada" className="mx-auto max-h-48 w-full rounded-xl object-contain" /> : <><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#fde9e4] text-[var(--brand-primary)]"><Icon name={validating ? "spinner" : "cloud-arrow-up"} className={validating ? "animate-spin text-xl" : "text-xl"} /></span><strong className="mt-3 block text-sm">{validating ? "Revisando imagen…" : isDragActive ? "Suelta tu foto aquí" : "Elige la foto de tu plato"}</strong><p className="mt-2 text-xs text-muted">Toca para buscar en tu dispositivo o arrastra una imagen aquí.</p><span className="mt-4 inline-block rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-xs font-bold text-white">Seleccionar imagen</span></>}
    </div>
    {file && <div className="mt-3"><p className="truncate text-xs font-bold">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p><div className="mt-2 flex gap-2"><button type="button" disabled={busy || validating} onClick={open} className="min-h-11 rounded-xl border border-[var(--brand-border)] px-3 text-xs font-bold">Elegir otra</button><button type="button" disabled={busy || validating} onClick={() => { setFile(null); setMessage(""); }} className="min-h-11 px-3 text-xs font-bold text-[#b9472e]">Quitar selección</button></div></div>}
    <p role="status" className="my-2 text-xs">{message}</p>
    <button type="button" disabled={!file || busy || validating} onClick={() => void upload()} className="min-h-12 w-full rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"><Icon name={busy ? "spinner" : "check"} className={`mr-2 ${busy ? "animate-spin" : ""}`} />{busy ? "Guardando foto…" : "Guardar foto"}</button>
    <p className="mt-2 text-xs">La foto se guarda por separado de los ingredientes de la receta.</p>
  </section>;
}
