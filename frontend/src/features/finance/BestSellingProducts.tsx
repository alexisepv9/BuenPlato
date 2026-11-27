/** Ranking de demanda real; las barras comparan unidades, no ingresos de ofertas. */
import type { FinanceDashboard } from "../../types/domain";

export function BestSellingProducts({ products }: { products: FinanceDashboard["bestSellingProducts"] }) {
  const maximum = Math.max(1, ...products.map((product) => product.quantity));
  return <section className="mt-5 rounded-3xl border border-[var(--brand-border)] bg-white p-5">
    <h2 className="text-base font-extrabold">Productos más vendidos</h2>
    <p className="mt-1 text-xs text-slate-500">Los 10 productos con más unidades en el período. Incluye ventas individuales, colaciones y promociones; excluye ventas anuladas.</p>
    {!products.length ? <p className="py-6 text-sm text-slate-500">Sin productos vendidos en este período.</p> :
      <ol className="mt-5 grid gap-4 md:grid-cols-2">{products.map((product, index) =>
        <li key={product.productId} className="min-w-0 rounded-xl border border-[var(--brand-border)] p-3">
          <div className="flex justify-between gap-3 text-sm"><strong>{index + 1}. {product.name}</strong><span className="shrink-0 font-bold">{product.quantity}</span></div>
          <div aria-hidden="true" className="my-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${product.quantity / maximum * 100}%` }} /></div>
          <p className="text-xs text-slate-500">Venta directa: {product.directQuantity} · En colaciones/promos: {product.offerQuantity}</p>
        </li>)}</ol>}
  </section>;
}
