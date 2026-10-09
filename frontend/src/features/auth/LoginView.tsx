/** Formulario de acceso: credenciales locales, visibilidad de contraseña y resultado de autenticación. */
import type { FormEvent } from "react";
import { useState } from "react";
import { apiClient, apiErrorMessage } from "../../lib/api";
import type { AuthUser } from "../../types/domain";
import { fieldClass } from "../../lib/presentation";
import { Icon, FloatingAlert } from "../../components/ui";
import { BrandLogo, useBrand } from "../settings/BrandProvider";

/** Autentica al usuario y entrega la sesión al contenedor principal. */
export function LoginView({ onAuthenticated, notice = "" }: { onAuthenticated: (user: AuthUser) => void; notice?: string }) {
  const { brand } = useBrand();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await apiClient.post<AuthUser>("/auth/login", { email, password });
      onAuthenticated(data);
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--brand-background)] p-4 [background-image:radial-gradient(circle_at_12%_12%,rgba(242,181,68,.28),transparent_28%),radial-gradient(circle_at_88%_88%,rgba(228,92,58,.16),transparent_28%)]">
      <section className="grid w-full max-w-4xl overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_30px_80px_rgba(92,60,26,.16)] md:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#f2b544,var(--brand-primary))] p-10 text-white md:block">
          <div className="relative z-10">
            <div className="grid size-14 place-items-center rounded-2xl bg-white/20 text-xl backdrop-blur"><BrandLogo /></div>
            <span className="mt-20 block text-[10px] font-extrabold uppercase tracking-[.2em] text-white/70">Buffet digital</span>
            <h1 className="mt-3 break-words text-4xl font-extrabold tracking-[-.05em]">{brand.name}</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">Ventas, menús configurables e inventario del local en un solo lugar.</p>
          </div>
          <span className="absolute -right-24 -bottom-24 size-72 rounded-full bg-[var(--brand-secondary)]/25" />
          <span className="absolute top-20 -right-12 size-40 rounded-full border border-white/20" />
        </div>
        <form className="p-6 sm:p-10" onSubmit={submit}>
          <div className="flex items-center gap-3 md:hidden"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-white"><BrandLogo /></div><strong className="break-words">{brand.name}</strong></div>
          <span className="mt-8 block text-[9px] font-extrabold uppercase tracking-[.18em] text-[var(--brand-primary)]">Acceso al sistema</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-.04em] text-[var(--brand-ink)]">Iniciar sesión</h2>
          <p className="mt-2 text-xs leading-5 text-[#7b847f]">Ingresa con el usuario asignado al administrador o a caja.</p>
          <FloatingAlert message={notice} tone="warning" />
          <FloatingAlert message={error} />
          <label className="mt-6 block">
            <span className="mb-1.5 block text-[10px] font-bold text-[var(--brand-muted)]">Correo electrónico</span>
            <input className={fieldClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[10px] font-bold text-[var(--brand-muted)]">Contraseña</span>
            <span className="relative block">
              <input className={`${fieldClass} pr-12`} type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-1 right-1 grid w-10 place-items-center rounded-lg text-[var(--brand-muted)] transition hover:bg-[var(--brand-soft)] hover:text-[var(--brand-primary)]" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}>
                <Icon name={showPassword ? "eye-slash" : "eye"} />
              </button>
            </span>
          </label>
          <button className="mt-6 h-12 w-full rounded-xl bg-[var(--brand-primary)] text-xs font-extrabold text-white shadow-[0_12px_28px_rgba(228,92,58,.24)] disabled:opacity-50" disabled={submitting}>
            <Icon name={submitting ? "spinner" : "right-to-bracket"} className={`mr-2 ${submitting ? "animate-spin" : ""}`} />
            {submitting ? "Ingresando" : "Entrar al sistema"}
          </button>
          <p className="mt-5 text-xs text-muted">Si necesitas acceso, contacta al administrador del local.</p>
        </form>
      </section>
    </main>
  );
}
