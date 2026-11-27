/** Revisión final accesible: no registra ni modifica el pedido hasta confirmar. */
import { useEffect, useRef } from "react";
import type { MenuCartLine, SalesCatalog } from "../../types/domain";
import { currency } from "../../lib/presentation";

type Props = {
  menus: MenuCartLine[];
  products: SalesCatalog["additionalProducts"];
  quantities: Record<number, number>;
  total: number;
  customer: string;
  service: string;
  payment: string;
  notes: string;
  editing: boolean;
  saving: boolean;
  error: string;
  onBack: () => void;
  onConfirm: () => void;
};

/** El diálogo nativo bloquea el fondo, retiene el foco y se sitúa sobre el nav móvil. */
export function SaleConfirmationDialog(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return <dialog ref={dialog} aria-labelledby="sale-confirm-title"
    onCancel={event => { event.preventDefault(); if (!props.saving) props.onBack(); }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-white p-0 text-[var(--brand-ink)] shadow-2xl backdrop:bg-black/45">
    <div className="flex max-h-[90dvh] flex-col">
      <header className="shrink-0 border-b border-[var(--brand-border)] p-5">
        <h2 id="sale-confirm-title" className="text-xl font-extrabold">{props.editing ? "Confirmar cambios de la venta" : "¿Confirmar esta venta?"}</h2>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">Revisa el pedido antes de registrarlo.</p>
      </header>
      <div className="min-h-0 space-y-4 overflow-y-auto p-5">
        {props.menus.map(line => <article key={line.key} className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-background)] p-3">
          <div className="flex justify-between gap-3 font-bold"><span>{line.quantity} × {line.menu.name.replace(/buffet/gi, "Colación")}</span><span>{currency.format(line.totalPrice)}</span></div>
          {line.menu.sections.map(section => <div key={section.id} className="mt-2 text-sm">
            {section.options.filter(option => (line.selections[section.id]?.[option.id] ?? 0) > 0).map(option => <p key={option.id}>{line.selections[section.id][option.id]} × {option.name}{line.quantity > 1 ? " por menú" : ""}</p>)}
          </div>)}
        </article>)}
        {props.products.filter(product => props.quantities[product.id] > 0).map(product => <div key={product.id} className="flex justify-between gap-3 text-sm"><span>{props.quantities[product.id]} × {product.name}</span><strong>{currency.format(product.price * props.quantities[product.id])}</strong></div>)}
        <div className="space-y-1 border-t border-[var(--brand-border)] pt-4 text-sm">
          <p>Cliente: {props.customer.trim() || "Sin nombre"}</p>
          <p>{props.service === "TAKEAWAY" ? "Para llevar" : "Consumir aquí"} · {({ CASH: "Efectivo", CARD: "Tarjeta", TRANSFER: "Transferencia" } as Record<string, string>)[props.payment] ?? props.payment}</p>
          {props.notes.trim() && <p className="whitespace-pre-wrap break-words">Cocina: {props.notes}</p>}
        </div>
        {props.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{props.error}</p>}
      </div>
      <footer className="shrink-0 border-t border-[var(--brand-border)] bg-[var(--brand-background)] p-5">
        <div className="mb-4 flex justify-between text-xl font-extrabold"><span>Total</span><span>{currency.format(props.total)}</span></div>
        <div className="grid grid-cols-2 gap-3">
          <button autoFocus type="button" disabled={props.saving} onClick={props.onBack} className="min-h-12 rounded-xl border border-[var(--brand-border)] bg-white px-3 text-sm font-bold disabled:opacity-50">Volver y revisar</button>
          <button type="button" disabled={props.saving} onClick={props.onConfirm} className="min-h-12 rounded-xl bg-[var(--brand-primary)] px-3 text-sm font-bold text-white disabled:opacity-50">{props.saving ? "Guardando…" : props.editing ? "Sí, guardar cambios" : "Sí, registrar venta"}</button>
        </div>
      </footer>
    </div>
  </dialog>;
}
