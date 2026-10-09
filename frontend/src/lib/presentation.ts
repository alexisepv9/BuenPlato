/** Formato monetario CLP y apariencia compartida de campos de formulario. */


export const currency = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const fieldClass =
  "h-12 w-full rounded-xl border border-[var(--brand-border)] bg-white px-3.5 text-sm text-[var(--brand-ink)] outline-none transition placeholder:text-[#9aa39e] focus:border-[var(--brand-secondary)] focus:ring-4 focus:ring-[var(--brand-secondary)]/10";
