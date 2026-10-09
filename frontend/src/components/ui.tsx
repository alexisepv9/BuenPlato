/** Controles visuales compartidos. No contiene reglas de ventas ni llamadas a la API. */
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { StockStatus } from "../types/domain";

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <i className={`fa-solid fa-${name} ${className}`} aria-hidden="true" />;
}

/** Notificación flotante reutilizable para resultados operativos y errores de API. */
export function FloatingAlert({ message, tone = "error" }: { message: string; tone?: "success" | "error" | "warning" }) {
  const [visible, setVisible] = useState(Boolean(message));
  useEffect(() => {
    setVisible(Boolean(message));
    if (!message) return;
    const timer = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);
  if (!message || !visible) return null;
  const style = tone === "success" ? "border-[#bcd8c3] bg-[#edf7ef] text-[#355b43]" : tone === "warning" ? "border-[#efd39c] bg-[#fff7e4] text-[#8b5b12]" : "border-red-200 bg-red-50 text-red-700";
  const icon = tone === "success" ? "circle-check" : tone === "warning" ? "triangle-exclamation" : "circle-exclamation";
  return <motion.div role="alert" initial={{ opacity: 0, y: -18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className={`fixed top-4 right-4 left-4 z-[100] mx-auto flex max-w-md items-start gap-3 rounded-2xl border p-4 text-xs font-semibold shadow-[0_18px_50px_rgba(36,48,43,.20)] backdrop-blur sm:left-auto ${style}`}><Icon name={icon} className="mt-0.5 text-base" /><span className="flex-1 leading-5">{message}</span><button type="button" onClick={() => setVisible(false)} className="grid size-7 place-items-center rounded-lg bg-white/60" aria-label="Cerrar notificación"><Icon name="xmark" /></button></motion.div>;
}

export function BrandedLoader({ label = "Cargando" }: { label?: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-4 text-center">
      <div className="relative grid size-20 place-items-center">
        <motion.span
          className="absolute inset-0 rounded-full border border-[var(--brand-primary)]/25"
          animate={{ scale: [0.72, 1.12], opacity: [0.9, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="absolute inset-2 rounded-full bg-[var(--brand-soft)]"
          animate={{ scale: [1, 1.08, 1], rotate: [0, 4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="relative grid size-12 place-items-center rounded-2xl bg-[var(--brand-primary)] text-lg text-white shadow-[0_10px_28px_rgba(228,92,58,.30)]"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon name="bowl-food" />
        </motion.span>
      </div>
      <div>
        <strong className="block text-xs font-extrabold text-[#34463d]">{label}</strong>
        <div className="mt-2 flex justify-center gap-1.5">
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="size-1.5 rounded-full bg-[var(--brand-primary)]"
              animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.14 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Encabezado estándar para todos los módulos.
 * Mantiene una única jerarquía, paleta, animación y tratamiento de acciones.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  actions?: ReactNode;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 25 }}
      className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(118deg,var(--brand-primary)_0%,var(--brand-primary)_48%,var(--brand-primary)_100%)] px-5 py-5 text-white shadow-[0_18px_45px_rgba(169,70,53,.20)] sm:px-6"
    >
      <motion.span className="absolute -right-14 -top-20 size-52 rounded-full bg-saffron/20 blur-2xl" animate={{ scale: [1, 1.14, 1] }} transition={{ duration: 7, repeat: Infinity }} />
      <span className="absolute -bottom-20 left-1/2 size-40 rounded-full bg-berry/20 blur-3xl" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <motion.div whileHover={{ rotate: -7, scale: 1.05 }} className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff5df] text-lg text-brand shadow-[0_8px_24px_rgba(82,34,25,.18)]">
            <Icon name={icon} />
          </motion.div>
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[8px] font-extrabold uppercase tracking-[.2em] text-[#ffe19a]">
              <span className="size-1.5 rounded-full bg-saffron shadow-[0_0_0_4px_rgba(242,181,68,.15)]" />{eyebrow}
            </div>
            <h1 className="text-[26px] font-extrabold tracking-[-.04em] sm:text-[32px]">{title}</h1>
            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-white/68">{description}</p>
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-end gap-2">{actions}</div>}
      </div>
    </motion.header>
  );
}

export function StatusPill({ status }: { status: StockStatus }) {
  const styles = {
    NORMAL: ["Disponible", "bg-[#e4f0df] text-[#43723d]", "circle-check"],
    LOW_STOCK: ["Stock bajo", "bg-[#fff0c8] text-[#8a5b00]", "triangle-exclamation"],
    OUT_OF_STOCK: ["Agotado", "bg-[#fde3dc] text-[#b13f29]", "circle-xmark"],
    UNTRACKED: ["Sin control", "bg-[#f0e4eb] text-[#81415a]", "minus"],
  }[status];
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold ${styles[1]}`}>
      <Icon name={styles[2]} />
      {styles[0]}
    </span>
  );
}

export function MetricCard({
  icon,
  label,
  value,
  helper,
  tone,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  value: number;
  helper: string;
  tone: "green" | "blue" | "amber" | "red";
  active: boolean;
  onClick: () => void;
}) {
  const color = {
    green: "bg-[#e4f0df] text-[#4d783f]",
    blue: "bg-[#dff0f3] text-[#39798b]",
    amber: "bg-[#fff0c8] text-[#9a6800]",
    red: "bg-[#fde3dc] text-[#be432b]",
  }[tone];
  const surface = {
    green: "from-[#ffffff] to-[#f1f7ed] shadow-[0_14px_35px_rgba(86,128,68,.10)]",
    blue: "from-[#ffffff] to-[#edf7f9] shadow-[0_14px_35px_rgba(57,121,139,.10)]",
    amber: "from-[#ffffff] to-[#fff7df] shadow-[0_14px_35px_rgba(154,104,0,.10)]",
    red: "from-[#ffffff] to-[#fff0ec] shadow-[0_14px_35px_rgba(190,67,43,.10)]",
  }[tone];
  const rail = {
    green: "from-[#7fa35c] to-[#a7c873]",
    blue: "from-[#4c93a6] to-[#74bac8]",
    amber: "from-[#f2b544] to-[#f7cf68]",
    red: "from-[var(--brand-primary)] to-[#f18868]",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-[22px] border bg-gradient-to-br p-4 text-left transition duration-300 md:p-5 ${surface} ${
        active ? "border-[var(--brand-secondary)] ring-2 ring-[var(--brand-secondary)]/10" : "border-white hover:-translate-y-1 hover:shadow-xl"
      }`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${rail}`} />
      <span className={`absolute -right-7 -bottom-8 size-24 rounded-full opacity-25 blur-2xl ${color}`} />
      <div className="flex items-start justify-between">
        <div className={`grid size-10 place-items-center rounded-[14px] text-xs shadow-[inset_0_1px_0_rgba(255,255,255,.7)] transition group-hover:scale-105 ${color}`}><Icon name={icon} /></div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#a0a7a3]">Hoy</span>
      </div>
      <strong className="relative mt-5 block text-2xl tracking-[-.04em] text-[#1e2d25] md:text-3xl">{value}</strong>
      <span className="mt-1 block text-[11px] font-bold text-[#45544c]">{label}</span>
      <span className="mt-1 hidden text-[10px] text-[#939b97] sm:block">{helper}</span>
    </button>
  );
}

export function FormSection({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--brand-border)] bg-white shadow-[0_1px_2px_rgba(20,35,27,.03)]">
      <header className="flex items-start gap-3 border-b border-[#e7e9e6] px-5 py-4">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#e7eee9] text-[9px] font-extrabold text-[var(--brand-secondary)]">{number}</span>
        <div>
          <h2 className="m-0 text-sm font-extrabold text-[#223128]">{title}</h2>
          <p className="mt-0.5 text-[10px] text-[#88918c]">{subtitle}</p>
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="flex items-center justify-between text-[10px] font-bold text-[var(--brand-muted)]">
        {label}
        {hint && <small className="font-normal text-[#9aa29e]">{hint}</small>}
      </span>
      {children}
    </label>
  );
}
