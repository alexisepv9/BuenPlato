/** Consulta de indicadores, gastos y reportes calculados por el backend. */
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { apiClient, apiErrorMessage } from "../../lib/api";
import type { FinanceDashboard } from "../../types/domain";
import { currency, fieldClass } from "../../lib/presentation";
import { Icon, FloatingAlert, BrandedLoader, PageHeader } from "../../components/ui";

/** Presenta métricas financieras del backend y genera reportes PDF/Excel. */
export function FinanceView() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(today);
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expense, setExpense] = useState({
    date: today, category: "Insumos", description: "", type: "VARIABLE", amount: "", paymentMethod: "TRANSFER",
  });

  useEffect(() => {
    setLoading(true);
    setError("");
    apiClient.get<FinanceDashboard>(`/finance/dashboard?from=${from}&to=${to}`)
      .then(({ data }) => setDashboard(data))
      .catch((requestError) => setError(apiErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [from, to, refreshKey]);

  async function downloadReport(format: "pdf" | "excel") {
    try {
      const response = await apiClient.get(`/finance/reports/${format}?from=${from}&to=${to}`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `buen-plato-finanzas-${from}-${to}.${format === "excel" ? "xlsx" : "pdf"}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  }

  async function saveExpense(event: FormEvent) {
    event.preventDefault();
    try {
      await apiClient.post("/finance/expenses", { ...expense, amount: Number(expense.amount) });
      setExpense((current) => ({ ...current, description: "", amount: "" }));
      setExpenseOpen(false);
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  }

  const metrics = dashboard?.metrics;
  const maxDaily = Math.max(...(dashboard?.dailySales.map((day) => day.revenue) ?? [0]), 1);
  const maxHourly = Math.max(...(dashboard?.hourlySales.map((hour) => hour.revenue) ?? [0]), 1);

  if (loading && !dashboard) {
    return <BrandedLoader label="Calculando indicadores" />;
  }

  return (
    <div className="mx-auto max-w-[1380px]">
      <PageHeader
        eyebrow="Inteligencia económica"
        title="Finanzas del local"
        description="Indicadores calculados con ventas, costos, gastos e inventario registrados en el backend."
        icon="chart-line"
        actions={
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-[8px] font-bold text-white/70">Desde<input className="h-10 rounded-xl border border-white/15 bg-white/95 px-2 text-xs text-charcoal outline-none" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
            <label className="grid gap-1 text-[8px] font-bold text-white/70">Hasta<input className="h-10 rounded-xl border border-white/15 bg-white/95 px-2 text-xs text-charcoal outline-none" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
          </div>
        }
      />

      <FloatingAlert message={error} />

      {metrics && <>
        <section className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <FinanceMetric icon="cash-register" label="Ventas netas" value={currency.format(metrics.revenue)} change={metrics.revenueChangePercentage} tone="orange" />
          <FinanceMetric icon="receipt" label="Pedidos" value={String(metrics.orders)} change={metrics.ordersChangePercentage} tone="blue" />
          <FinanceMetric icon="ticket" label="Ticket promedio" value={currency.format(metrics.averageTicket)} tone="yellow" />
          <FinanceMetric icon="utensils" label="Costo alimentos" value={`${metrics.foodCostPercentage}%`} helper={currency.format(metrics.foodCost)} tone="red" />
          <FinanceMetric icon="sack-dollar" label="Utilidad bruta" value={currency.format(metrics.grossProfit)} helper={`${metrics.grossMarginPercentage}% de margen`} tone="green" />
          <FinanceMetric icon="file-invoice-dollar" label="Gastos operacionales" value={currency.format(metrics.operatingExpenses)} tone="purple" />
          <FinanceMetric icon="scale-balanced" label="Resultado operacional" value={currency.format(metrics.operatingResult)} helper={metrics.operatingResult >= 0 ? "Resultado positivo" : "Resultado negativo"} tone={metrics.operatingResult >= 0 ? "green" : "red"} />
          <FinanceMetric icon="bullseye" label="Punto de equilibrio" value={currency.format(metrics.breakEvenSales)} helper="Ventas necesarias para cubrir gastos fijos" tone="blue" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
          <article className="rounded-[24px] border border-[var(--brand-border)] bg-white p-5">
            <div className="flex items-center justify-between"><div><span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[var(--brand-primary)]">Tendencia</span><h2 className="mt-1 text-base font-extrabold">Ventas diarias</h2></div><span className="text-[9px] text-[#8a928d]">{dashboard.dailySales.length} días activos</span></div>
            <div className="mt-5 flex h-52 items-end gap-2 overflow-x-auto border-b border-[var(--brand-border)] pb-2">
              {dashboard.dailySales.length ? dashboard.dailySales.map((day) => <div key={day.date} className="flex min-w-9 flex-1 flex-col items-center justify-end gap-2"><span className="text-[8px] font-bold">{currency.format(day.revenue)}</span><div className="w-full rounded-t-lg bg-[linear-gradient(180deg,#f2b544,var(--brand-primary))]" style={{ height: `${Math.max(8, day.revenue / maxDaily * 140)}px` }} /><span className="text-[8px] text-[#969c97]">{day.date.slice(5)}</span></div>) : <p className="m-auto text-xs text-[#949b96]">Sin ventas en el período.</p>}
            </div>
          </article>
          <article className="rounded-[24px] border border-[var(--brand-border)] bg-white p-5">
            <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#4c93a6]">Análisis ejecutivo</span><h2 className="mt-1 text-base font-extrabold">Decisiones sugeridas</h2>
            <div className="mt-4 space-y-2">{dashboard.insights.map((insight, index) => <div key={insight} className="flex gap-3 rounded-xl bg-[#f8f7f2] p-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#fff0d2] text-[9px] font-extrabold text-[#a86816]">{index + 1}</span><p className="text-[10px] leading-4 text-[#5f6b64]">{insight}</p></div>)}</div>
          </article>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[24px] border border-[var(--brand-border)] bg-white p-5">
            <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[var(--brand-secondary)]">Mezcla comercial</span><h2 className="mt-1 text-base font-extrabold">Ventas por categoría</h2>
            <div className="mt-5 space-y-3">{dashboard.categories.map((category) => <div key={category.label}><div className="flex justify-between text-[10px]"><strong>{category.label}</strong><span>{currency.format(category.amount)} · {category.percentage}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f1ece4]"><div className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-secondary),var(--brand-primary))]" style={{ width: `${category.percentage}%` }} /></div></div>)}</div>
          </article>
          <article className="rounded-[24px] border border-[var(--brand-border)] bg-white p-5">
            <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#4c93a6]">Demanda intradía</span><h2 className="mt-1 text-base font-extrabold">Ventas por hora</h2>
            <div className="mt-5 flex h-40 items-end gap-2">{dashboard.hourlySales.length ? dashboard.hourlySales.map((hour) => <div key={hour.hour} className="flex flex-1 flex-col items-center justify-end gap-2"><div className="w-full rounded-t-md bg-[#4c93a6]" style={{ height: `${Math.max(7, hour.revenue / maxHourly * 105)}px` }} /><span className="text-[8px] text-[#8a928d]">{String(hour.hour).padStart(2, "0")}h</span></div>) : <p className="m-auto text-xs text-[#949b96]">Sin datos horarios.</p>}</div>
          </article>
        </section>

        <section className="mt-5 overflow-hidden rounded-[24px] border border-[var(--brand-border)] bg-white">
          <div className="flex flex-col gap-3 border-b border-[var(--brand-border)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#5c874e]">Rentabilidad</span><h2 className="mt-1 text-base font-extrabold">Contribución por producto</h2></div>
            <div className="flex gap-2"><button onClick={() => downloadReport("pdf")} className="h-10 rounded-xl border border-[#e0d8cb] px-3 text-[10px] font-bold"><Icon name="file-pdf" className="mr-2 text-[var(--brand-primary)]" />PDF</button><button onClick={() => downloadReport("excel")} className="h-10 rounded-xl bg-[var(--brand-secondary)] px-3 text-[10px] font-bold text-white"><Icon name="file-excel" className="mr-2" />Excel</button></div>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-[10px]"><thead className="bg-[#faf7f1] text-[8px] uppercase text-[#858d88]"><tr><th className="p-3">Producto</th><th>Cantidad</th><th>Ventas</th><th>Costo</th><th>Contribución</th><th>Margen</th></tr></thead><tbody>{dashboard.topItems.map((item) => <tr key={item.name} className="border-t border-[#f0ebe3]"><td className="p-3 font-bold">{item.name}</td><td>{item.quantity}</td><td>{currency.format(item.revenue)}</td><td>{currency.format(item.cost)}</td><td className="font-bold text-[#47733c]">{currency.format(item.contribution)}</td><td>{item.revenue ? Math.round(item.contribution / item.revenue * 100) : 0}%</td></tr>)}</tbody></table></div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_.75fr]">
          <article className="overflow-hidden rounded-[24px] border border-[var(--brand-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--brand-border)] p-5"><div><span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[var(--brand-secondary)]">Egresos</span><h2 className="mt-1 text-base font-extrabold">Gastos registrados</h2></div><button onClick={() => setExpenseOpen((open) => !open)} className="h-10 rounded-xl bg-[var(--brand-primary)] px-3 text-[10px] font-extrabold text-white"><Icon name="plus" className="mr-2" />Registrar</button></div>
            {expenseOpen && <form onSubmit={saveExpense} className="grid gap-2 border-b border-[var(--brand-border)] bg-[#fff9ef] p-4 sm:grid-cols-2"><input className={fieldClass} type="date" value={expense.date} onChange={(event) => setExpense({ ...expense, date: event.target.value })} required /><input className={fieldClass} placeholder="Categoría" value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value })} required /><input className={`${fieldClass} sm:col-span-2`} placeholder="Descripción" value={expense.description} onChange={(event) => setExpense({ ...expense, description: event.target.value })} required /><input className={fieldClass} type="number" min="1" placeholder="Monto CLP" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} required /><select className={fieldClass} value={expense.type} onChange={(event) => setExpense({ ...expense, type: event.target.value })}><option value="FIXED">Gasto fijo</option><option value="VARIABLE">Gasto variable</option></select><button className="h-11 rounded-xl bg-[var(--brand-secondary)] text-xs font-bold text-white sm:col-span-2">Guardar gasto</button></form>}
            <div className="max-h-72 overflow-auto">{dashboard.expenses.map((row) => <div key={row.id} className="grid grid-cols-[80px_1fr_auto] gap-3 border-b border-[#f0ebe3] p-3 text-[10px]"><span className="text-[#8b928e]">{row.date}</span><span><strong className="block">{row.description}</strong><small>{row.category} · {row.type === "FIXED" ? "Fijo" : "Variable"}</small></span><strong>{currency.format(row.amount)}</strong></div>)}</div>
          </article>
          <article className="rounded-[24px] border border-[var(--brand-border)] bg-white p-5">
            <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[var(--brand-primary)]">Capital de trabajo</span><h2 className="mt-1 text-base font-extrabold">Inventario y alertas</h2>
            <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#edf5eb] p-3"><span className="text-[8px] uppercase">Inventario valorizado</span><strong className="mt-1 block text-lg text-[var(--brand-secondary)]">{currency.format(metrics.inventoryValue)}</strong></div><div className="rounded-xl bg-[#fff0df] p-3"><span className="text-[8px] uppercase">Mermas</span><strong className="mt-1 block text-lg text-[var(--brand-primary)]">{currency.format(metrics.wasteCost)}</strong></div></div>
            <div className="mt-4 space-y-2">{dashboard.stockRisks.slice(0, 6).map((risk) => <div key={risk.productId} className="flex gap-3 rounded-xl border border-[#eee4d7] p-3"><Icon name="triangle-exclamation" className="text-[#e3a52d]" /><span><strong className="block text-[10px]">{risk.name}</strong><small className="text-[9px] text-[#8a928d]">{risk.stock} disponibles · mínimo {risk.threshold}</small></span></div>)}</div>
          </article>
        </section>
      </>}
    </div>
  );
}

export function FinanceMetric({ icon, label, value, helper, change, tone }: { icon: string; label: string; value: string; helper?: string; change?: number; tone: "orange" | "blue" | "yellow" | "red" | "green" | "purple" }) {
  const tones = {
    orange: "bg-[#fff0e8] text-[var(--brand-primary)]", blue: "bg-[#e8f3f5] text-[#39798b]",
    yellow: "bg-[#fff4d8] text-[#a46a16]", red: "bg-[#fde9e4] text-[#b9472e]",
    green: "bg-[#e9f3e6] text-[#47733c]", purple: "bg-[#f3e8ee] text-[#8b4560]",
  };
  return (
    <article className="rounded-2xl border border-[#e8e1d7] bg-white p-4 shadow-[0_10px_30px_rgba(52,78,65,.06)]">
      <div className="flex items-start justify-between">
        <div className={`grid size-9 place-items-center rounded-xl ${tones[tone]}`}><Icon name={icon} /></div>
        {change !== undefined && <span className={`rounded-full px-2 py-1 text-[8px] font-extrabold ${change >= 0 ? "bg-[#e9f3e6] text-[#47733c]" : "bg-[#fde9e4] text-[#b9472e]"}`}><Icon name={change >= 0 ? "arrow-up" : "arrow-down"} className="mr-1" />{Math.abs(change)}%</span>}
      </div>
      <strong className="mt-4 block text-xl font-extrabold tracking-[-.04em]">{value}</strong>
      <span className="mt-1 block text-[9px] font-bold text-[#747e77]">{label}</span>
      {helper && <small className="mt-1 block text-[8px] text-[#9aa09c]">{helper}</small>}
    </article>
  );
}
