/** Impresión manual de comprobantes internos y comandas térmicas de 80 mm. Sin emisión SII. */
import { apiClient, apiErrorMessage } from "../../lib/api";
import type { OrderHistory } from "../../types/domain";
import { currency } from "../../lib/presentation";

type PrintKind = "customer" | "kitchen";

/** Todo texto del pedido se escapa antes de insertarlo en el documento HTML independiente. */
const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

/** Plantilla sin imágenes ni fuentes externas: no depende de descargas al imprimir. */
export function receiptHtml(order: OrderHistory, kind: PrintKind, copy: boolean): string {
  const kitchen = kind === "kitchen";
  const title = kitchen ? "COMANDA DE COCINA" : "COMPROBANTE DE VENTA";
  const date = new Date(order.createdAt).toLocaleString("es-CL", { timeZone: "America/Santiago" });
  const payment = ({ CASH: "Efectivo", CARD: "Tarjeta", TRANSFER: "Transferencia" } as Record<string, string>)[order.paymentMethod] ?? order.paymentMethod;
  const lines = order.items.map(item => `<section class="line">
    <div class="row"><strong>${item.quantity} × ${escape(item.itemName)}</strong>${kitchen ? "" : `<strong class="money">${escape(currency.format(item.totalPrice))}</strong>`}</div>
    ${item.selections.map(selection => `<div class="selection">${selection.totalQuantity} × ${escape(selection.name)}</div>`).join("")}
    ${kitchen || item.itemType === "MENU" ? "" : `<small>Precio unitario: ${escape(currency.format(item.unitPrice))}</small>`}
    ${item.itemType === "MENU" && item.quantity > 1 ? `<small>Composición indicada para los ${item.quantity} menús de esta línea.</small>` : ""}
  </section>`).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title} · ${escape(order.orderNumber)}</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#eee;color:#000;font-family:Arial,sans-serif}
    .toolbar{padding:16px;max-width:600px;margin:auto;font-size:14px}.toolbar button{padding:12px 20px;cursor:pointer}
    .paper{width:80mm;padding:4mm;margin:16px auto;background:white;font-size:${kitchen ? "15" : "12"}px;line-height:1.4;overflow-wrap:anywhere}
    h1,h2,p{margin:0 0 6px}h1{font-size:19px}h2{font-size:16px}.center{text-align:center}
    .row{display:flex;justify-content:space-between;gap:8px}.money{white-space:nowrap}.line{padding:10px 0;border-bottom:1px dashed #000;break-inside:avoid}
    .selection{padding-left:8px;margin-top:4px}small{display:block;font-size:11px}.notes{white-space:pre-wrap;border:2px solid #000;padding:8px;margin-top:12px}
    .total{font-size:19px;margin-top:12px}.flag{border:2px solid #000;padding:5px;font-weight:bold;margin:8px 0}
    @page{size:80mm auto;margin:0}
    @media print{body{background:white}.toolbar{display:none}.paper{margin:0;width:100%;max-width:80mm;box-shadow:none}}
  </style></head><body>
  <div class="toolbar"><button id="print">Imprimir</button><p>Selecciona la impresora ${kitchen ? "de cocina" : "del cliente"}, papel de 80 mm, escala 100 %, sin encabezados ni pies del navegador. Imprimir no vuelve a registrar la venta.</p></div>
  <main class="paper">
    <header class="center"><h1>Buen Plato</h1><h2>${title}</h2>
    ${!kitchen ? "<p>NO VÁLIDO COMO BOLETA TRIBUTARIA</p>" : ""}
    ${copy ? '<p class="flag">REIMPRESIÓN / COPIA</p>' : ""}
    ${order.revision > 0 ? `<p class="flag">PEDIDO MODIFICADO · VERSIÓN ${order.revision}<br>Reemplaza la comanda anterior. Revisar antes de preparar.</p>` : ""}
    <strong>${escape(order.orderNumber)}</strong><p>${escape(date)}</p>
    <h2>${order.serviceType === "TAKEAWAY" ? "PARA LLEVAR" : "SERVIR EN LOCAL"}</h2>
    ${order.customerName ? `<p>Cliente: ${escape(order.customerName)}</p>` : ""}</header>
    ${lines}
    ${order.notes ? `<div class="notes"><strong>OBSERVACIONES</strong><br>${escape(order.notes)}</div>` : ""}
    ${kitchen ? "" : `<div class="row total"><strong>TOTAL</strong><strong>${escape(currency.format(order.total))}</strong></div><p>Pago: ${escape(payment)}</p><p class="center">Gracias por tu compra</p>`}
  </main></body></html>`;
}

/** Abre la ventana desde el clic para evitar bloqueos; luego carga el detalle autorizado del servidor. */
export async function openOrderPrint(id: number, kind: PrintKind, copy = false): Promise<void> {
  const popup = window.open("", "_blank", "popup,width=460,height=760");
  if (!popup) throw new Error("Permite las ventanas emergentes para abrir la impresión.");
  popup.opener = null;
  popup.document.body.textContent = "Cargando pedido para imprimir…";
  try {
    const { data } = await apiClient.get<OrderHistory>(`/orders/${id}`);
    if (popup.closed) return;
    popup.document.open(); popup.document.write(receiptHtml(data, kind, copy)); popup.document.close();
    popup.document.getElementById("print")?.addEventListener("click", () => { popup.focus(); popup.print(); });
  } catch (error) {
    if (!popup.closed) popup.document.body.textContent = apiErrorMessage(error);
    throw error;
  }
}
