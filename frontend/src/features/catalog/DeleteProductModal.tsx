/** Confirmación de baja lógica; conserva ventas e insumos. */
import { useEffect, useRef, useState } from "react";
import type { Product } from "../../types/domain";
import { apiClient, apiErrorMessage } from "../../lib/api";

export function DeleteProductModal({ product, onClose, onDeleted }: {
  product: Product; onClose: () => void; onDeleted: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /** Foco inicial en Cancelar y restauración al cerrar. */
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal(); cancel.current?.focus();
    return () => { element?.close(); previous?.focus(); };
  }, []);
  /** Solo notifica eliminación después de la confirmación de la API. */
  async function remove() {
    if (busy) return;
    setBusy(true); setError("");
    try { await apiClient.delete(`/products/${product.id}`); onDeleted(); }
    catch (failure) { setError(apiErrorMessage(failure)); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} aria-labelledby="delete-product-heading" aria-describedby="delete-product-description" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-border bg-white p-5 text-ink shadow-2xl backdrop:bg-black/45">
    <h2 id="delete-product-heading" className="text-xl font-semibold">Eliminar producto</h2>
    <p id="delete-product-description" className="my-4 text-sm text-muted">¿Eliminar <strong className="break-words text-ink">{product.name}</strong> del catálogo? Dejará de estar disponible para nuevas ventas. El historial se conserva; no se eliminan insumos ni se modifican las existencias de bodega.</p>
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <footer className="flex gap-3"><button ref={cancel} type="button" disabled={busy} onClick={onClose} className="min-h-12 flex-1 rounded-xl border border-border px-3">Cancelar</button><button type="button" disabled={busy} onClick={() => void remove()} className="min-h-12 flex-1 rounded-xl bg-red-700 px-3 font-semibold text-white disabled:opacity-50">{busy ? "Eliminando…" : "Sí, eliminar"}</button></footer>
  </dialog>;
}
