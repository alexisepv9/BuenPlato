/** Campana conectada al servidor; lecturas guardadas por usuario y navegador. */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiClient, apiErrorMessage } from "../lib/api";
import { Icon } from "./ui";

type Notice = { id: string; title: string; message: string };

export function NotificationBell({ userId }: { userId: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const key = `buenplato:notifications:${userId}`;
  const [read, setRead] = useState<string[]>(() => {
    try { const value = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
  });
  useEffect(() => {
    const abort = new AbortController();
    async function refresh() {
      try { const { data } = await apiClient.get<Notice[]>("/notifications", { signal: abort.signal }); setItems(data); setError(""); }
      catch (failure) { if (!abort.signal.aborted) setError(apiErrorMessage(failure)); }
    }
    void refresh();
    const timer = window.setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    window.addEventListener("buenplato:sale-changed", refresh);
    return () => { abort.abort(); clearInterval(timer); window.removeEventListener("buenplato:sale-changed", refresh); };
  }, [userId]);
  const unread = items.filter(item => !read.includes(item.id)).length;
  function markRead() {
    const ids = items.map(item => item.id); setRead(ids);
    try { localStorage.setItem(key, JSON.stringify(ids)); } catch { /* Modo privado: conserva lectura en memoria. */ }
  }
  return <>
    <button onClick={() => setOpen(true)} aria-label={`Notificaciones: ${unread} sin leer`} className="relative ml-2 grid size-10 place-items-center rounded-xl border border-[var(--brand-border)] bg-white text-[#526159]">
      <Icon name="bell" />{unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[var(--brand-primary)] px-1.5 text-[10px] text-white">{unread}</span>}
    </button>
    {open && createPortal(<div className="fixed inset-0 z-[100] flex justify-end bg-black/30 p-3" onClick={() => setOpen(false)}>
      <section role="dialog" aria-modal="true" aria-label="Notificaciones" className="flex h-full w-full max-w-md flex-col rounded-2xl bg-white p-5 shadow-xl" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Notificaciones</h2><button aria-label="Cerrar notificaciones" onClick={() => setOpen(false)} className="size-11"><Icon name="xmark" /></button></div>
        <button onClick={markRead} className="my-3 text-left text-sm text-[var(--brand-primary)]">Marcar como leídas</button>
        {error && <p role="alert">{error}</p>}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">{items.map(item => <article key={item.id} className={`rounded-xl border p-3 ${read.includes(item.id) ? "bg-white" : "bg-[#fff4e9]"}`}><strong className="text-sm">{item.title}</strong><p className="mt-1 text-xs">{item.message}</p></article>)}{items.length === 0 && !error && <p>No hay notificaciones disponibles.</p>}</div>
        <p className="mt-3 text-xs text-gray-500">Actualización cada 15 segundos mientras la página está visible.</p>
      </section>
    </div>, document.body)}
  </>;
}
