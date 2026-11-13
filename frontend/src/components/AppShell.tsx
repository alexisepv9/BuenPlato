/** Estructura responsive y navegación según el rol. El backend valida los permisos efectivos. */
import type { ReactNode } from "react";
import type { AuthUser, View } from "../types/domain";
import { Icon } from "./ui";
import { NotificationBell } from "./NotificationBell";
import { BrandLogo, useBrand } from "../features/settings/BrandProvider";

/** Estructura compartida: cabecera, navegación responsive y área de contenido. */
export function AppShell({
  view,
  onNavigate,
  user,
  onLogout,
  children,
}: {
  view: View;
  onNavigate: (view: View) => void;
  user: AuthUser;
  onLogout: () => void;
  children: ReactNode;
}) {
  const isAdmin = user.role === "ADMIN";
  const { brand } = useBrand();
  // Una sola definición evita diferencias de orden entre escritorio y móvil.
  const navigation: { view: View; label: string; icon: string; admin?: boolean }[] = [
    { view: "sales", label: "Venta", icon: "cash-register" },
    { view: "products", label: "Productos", icon: "utensils", admin: true },
    { view: "ingredients", label: "Insumos", icon: "boxes-stacked", admin: true },
    { view: "finance", label: "Finanzas", icon: "chart-line", admin: true },
    { view: "settings", label: "Configuración", icon: "sliders", admin: true },
  ];
  const visibleNavigation = navigation.filter(item => !item.admin || isAdmin);
  const activeView = view === "new-product" ? "products" : view;
  const pageTitle = {
    sales: "Venta",
    ingredients: "Insumos",
    products: "Productos",
    finance: "Finanzas",
    settings: "Configuración",
    "new-product": "Nuevo producto",
  }[view];

  return (
    <div className="min-h-screen bg-[var(--brand-background)] text-[var(--brand-ink)] [background-image:radial-gradient(circle_at_85%_5%,rgba(242,181,68,.12),transparent_23%),radial-gradient(circle_at_10%_90%,rgba(76,147,166,.08),transparent_28%)] lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col overflow-y-auto bg-[radial-gradient(circle_at_10%_5%,var(--brand-primary)_0%,var(--brand-secondary)_42%,var(--brand-secondary)_100%)] px-5 py-6 text-white shadow-[14px_0_45px_rgba(101,48,68,.18)] lg:flex">
        <span className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full border border-white/8" />
        <span className="pointer-events-none absolute -top-6 -right-4 size-24 rounded-full bg-[#f2b544]/10 blur-xl" />
        <div className="relative flex items-center gap-3 px-2">
          <div className="grid size-11 place-items-center rounded-xl bg-[var(--brand-primary)] text-lg shadow-lg shadow-black/10">
            <BrandLogo />
          </div>
          <div>
            <strong className="block break-words text-[15px] tracking-tight">{brand.name}</strong>
            <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/55">Buffet digital</span>
          </div>
        </div>

        <p className="relative mt-12 px-3 text-[9px] font-extrabold uppercase tracking-[.18em] text-white/40">Menú principal</p>
        <nav className="relative mt-3 space-y-1.5" aria-label="Navegación principal">
          {visibleNavigation.map(item => <SidebarItem key={item.view} icon={item.icon} label={item.label} active={activeView === item.view} onClick={() => onNavigate(item.view)} />)}
        </nav>

        <div className="relative mt-auto rounded-2xl border border-white/10 bg-white/8 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-[#d97a4a] text-xs font-extrabold">WR</div>
            <div className="min-w-0">
              <strong className="block truncate text-xs">{user.displayName}</strong>
              <span className="block truncate text-[10px] text-white/45">{user.role === "ADMIN" ? "Administrador" : "Caja"}</span>
            </div>
            <button className="ml-auto grid size-8 place-items-center rounded-lg text-white/55 hover:bg-white/10 hover:text-white" onClick={onLogout} aria-label="Cerrar sesión">
              <Icon name="right-from-bracket" className="text-[10px]" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex h-[100dvh] min-w-0 flex-col overflow-hidden lg:block lg:h-auto lg:overflow-visible">
        <header className="z-20 flex h-[72px] shrink-0 items-center border-b border-white/70 bg-white/80 px-4 shadow-[0_8px_30px_rgba(47,93,80,.06)] backdrop-blur-xl lg:sticky lg:top-0 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--brand-primary)] text-sm text-white lg:hidden">
              <BrandLogo />
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-[13px] font-extrabold tracking-[-.02em] text-[var(--brand-ink)]">{brand.name}</strong>
              <span className="block truncate text-[9px] font-bold uppercase tracking-[.14em] text-[#8b918c]">
                Buffet digital · {pageTitle}
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-right md:block">
              <strong className="block text-[11px] text-[var(--brand-secondary)]">Servicio de almuerzo</strong>
              <small className="text-[10px] text-[#89928d]">Local abierto · Turno actual</small>
            </span>
            <NotificationBell key={user.id} userId={user.id} />
            <button title="Cerrar sesión" className="grid size-10 place-items-center rounded-xl border border-[#f0d9d2] bg-[var(--brand-soft)] text-[#c94c30]" onClick={onLogout} aria-label="Cerrar sesión">
              <Icon name="right-from-bracket" />
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-6 [scrollbar-gutter:stable] md:px-8 md:pb-6 lg:overflow-visible lg:py-8 xl:px-10">{children}</main>

        <nav className="z-40 mx-2 mt-2 grid shrink-0 rounded-2xl border border-border bg-white p-1 shadow-sm [margin-bottom:max(.5rem,env(safe-area-inset-bottom))] lg:hidden" style={{ gridTemplateColumns: `repeat(${visibleNavigation.length}, minmax(0, 1fr))` }} aria-label="Navegación móvil">
          {visibleNavigation.map(item => <MobileNavItem key={item.view} icon={item.icon} label={item.label} active={activeView === item.view} onClick={() => onNavigate(item.view)} />)}
        </nav>
      </div>
    </div>
  );
}

export function MobileNavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-extrabold transition ${
        active ? "bg-[var(--brand-primary)] text-white shadow-sm" : "text-[var(--brand-muted)]"
      }`}
    >
      <Icon name={icon} className="text-sm" />
      {label}
    </button>
  );
}

export function SidebarItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-semibold transition ${
        active ? "bg-white/95 text-[var(--brand-secondary)] shadow-[0_8px_25px_rgba(65,25,39,.18)]" : "text-white/65 hover:bg-white/8 hover:text-white"
      }`}
    >
      <Icon name={icon} className={`w-4 ${active ? "text-[#f2b544]" : "text-white/40"}`} />
      {label}
      {active && <span className="ml-auto size-1.5 rounded-full bg-[var(--brand-primary)]" />}
    </button>
  );
}
