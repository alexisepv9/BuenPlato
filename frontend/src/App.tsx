/**
 * Aplicación principal de Buen Plato.
 * Contiene el shell responsive y los módulos de autenticación, venta buffet,
 * inventario y finanzas. Cada vista consume exclusivamente la API mediante el
 * cliente compartido y reutiliza la paleta definida en styles.css.
 */
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { apiClient, apiErrorMessage } from "./lib/api";

type Category = {
  id: number;
  name: string;
  slug: string;
  categoryType: string;
};

type StockStatus = "NORMAL" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNTRACKED";
type InventoryStatusFilter = "" | "LOW_STOCK" | "OUT_OF_STOCK";

type Product = {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  trackStock: boolean;
  stockStatus: StockStatus;
  category: Category;
};

type ProductPage = {
  content: Product[];
  totalElements: number;
};

type SaleOption = {
  id: number;
  productId: number;
  name: string;
  description: string;
  price: number;
  extraPrice: number;
  stock: number;
};

type SaleSection = {
  id: number;
  label: string;
  categorySlug: string;
  minimumSelections: number;
  maximumSelections: number;
  required: boolean;
  options: SaleOption[];
};

type SaleMenu = {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  sections: SaleSection[];
};

type SaleProduct = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  categorySlug: string;
  stock: number;
};

type SalesCatalog = {
  menus: SaleMenu[];
  additionalProducts: SaleProduct[];
};

type MenuCartLine = {
  key: string;
  menu: SaleMenu;
  selections: Record<number, Record<number, number>>;
  quantity: number;
  totalPrice: number;
};

type CreatedOrder = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  total: number;
  createdAt: string;
};

type OrderHistory = {
  id: number;
  orderNumber: string;
  customerName: string | null;
  serviceType: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  total: number;
  notes: string | null;
  createdAt: string;
  items: { itemType: string; itemName: string; quantity: number; unitPrice: number; totalPrice: number }[];
};

type AuthUser = {
  id: number;
  email: string;
  displayName: string;
  role: string;
};

type FinanceDashboard = {
  from: string;
  to: string;
  metrics: {
    revenue: number;
    orders: number;
    averageTicket: number;
    unitsSold: number;
    foodCost: number;
    foodCostPercentage: number;
    grossProfit: number;
    grossMarginPercentage: number;
    operatingExpenses: number;
    operatingResult: number;
    fixedExpenses: number;
    breakEvenSales: number;
    inventoryValue: number;
    wasteCost: number;
    revenueChangePercentage: number;
    ordersChangePercentage: number;
  };
  dailySales: { date: string; revenue: number; orders: number }[];
  paymentMethods: { label: string; amount: number; percentage: number }[];
  categories: { label: string; amount: number; percentage: number }[];
  topItems: { name: string; quantity: number; revenue: number; cost: number; contribution: number }[];
  hourlySales: { hour: number; revenue: number; orders: number }[];
  expenses: { id: number; date: string; category: string; description: string; type: string; amount: number; paymentMethod: string }[];
  stockRisks: { productId: number; sku: string; name: string; stock: number; threshold: number; inventoryValue: number }[];
  insights: string[];
};

type View = "sales" | "inventory" | "finance" | "new-product";

const currency = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const fieldClass =
  "h-12 w-full rounded-xl border border-[#d9ddd9] bg-white px-3.5 text-sm text-[#1d2923] outline-none transition placeholder:text-[#9aa39e] focus:border-[#426451] focus:ring-4 focus:ring-[#426451]/10";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <i className={`fa-solid fa-${name} ${className}`} aria-hidden="true" />;
}

function BrandedLoader({ label = "Cargando" }: { label?: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-4 text-center">
      <div className="relative grid size-20 place-items-center">
        <motion.span
          className="absolute inset-0 rounded-full border border-[#e45c3a]/25"
          animate={{ scale: [0.72, 1.12], opacity: [0.9, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.span
          className="absolute inset-2 rounded-full bg-[#fff1dc]"
          animate={{ scale: [1, 1.08, 1], rotate: [0, 4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="relative grid size-12 place-items-center rounded-2xl bg-[#e45c3a] text-lg text-white shadow-[0_10px_28px_rgba(228,92,58,.30)]"
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
              className="size-1.5 rounded-full bg-[#e45c3a]"
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
function PageHeader({
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
      className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(118deg,#a94635_0%,#c95239_48%,#df7445_100%)] px-5 py-5 text-white shadow-[0_18px_45px_rgba(169,70,53,.20)] sm:px-6"
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

/** Autentica al usuario y entrega la sesión al contenedor principal. */
function LoginView({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <main className="grid min-h-screen place-items-center bg-[#fff8ed] p-4 [background-image:radial-gradient(circle_at_12%_12%,rgba(242,181,68,.28),transparent_28%),radial-gradient(circle_at_88%_88%,rgba(228,92,58,.16),transparent_28%)]">
      <section className="grid w-full max-w-4xl overflow-hidden rounded-[30px] border border-white bg-white shadow-[0_30px_80px_rgba(92,60,26,.16)] md:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#f2b544,#e97943)] p-10 text-white md:block">
          <div className="relative z-10">
            <div className="grid size-14 place-items-center rounded-2xl bg-white/20 text-xl backdrop-blur"><Icon name="utensils" /></div>
            <span className="mt-20 block text-[10px] font-extrabold uppercase tracking-[.2em] text-white/70">Buffet digital</span>
            <h1 className="mt-3 text-4xl font-extrabold tracking-[-.05em]">Buen Plato</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">Ventas, menús configurables e inventario del local en un solo lugar.</p>
          </div>
          <span className="absolute -right-24 -bottom-24 size-72 rounded-full bg-[#9a4965]/25" />
          <span className="absolute top-20 -right-12 size-40 rounded-full border border-white/20" />
        </div>
        <form className="p-6 sm:p-10" onSubmit={submit}>
          <div className="grid size-12 place-items-center rounded-2xl bg-[#e45c3a] text-white shadow-[0_10px_25px_rgba(228,92,58,.24)] md:hidden"><Icon name="utensils" /></div>
          <span className="mt-8 block text-[9px] font-extrabold uppercase tracking-[.18em] text-[#e45c3a]">Acceso al sistema</span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-.04em] text-[#29342f]">Iniciar sesión</h2>
          <p className="mt-2 text-xs leading-5 text-[#7b847f]">Ingresa con el usuario asignado al administrador o a caja.</p>
          {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-semibold text-red-700"><Icon name="circle-exclamation" className="mr-2" />{error}</div>}
          <label className="mt-6 block">
            <span className="mb-1.5 block text-[10px] font-bold text-[#536159]">Correo electrónico</span>
            <input className={fieldClass} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[10px] font-bold text-[#536159]">Contraseña</span>
            <input className={fieldClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button className="mt-6 h-12 w-full rounded-xl bg-[#e45c3a] text-xs font-extrabold text-white shadow-[0_12px_28px_rgba(228,92,58,.24)] disabled:opacity-50" disabled={submitting}>
            <Icon name={submitting ? "spinner" : "right-to-bracket"} className={`mr-2 ${submitting ? "animate-spin" : ""}`} />
            {submitting ? "Ingresando" : "Entrar a Buen Plato"}
          </button>
          <p className="mt-5 rounded-xl bg-[#fff8e9] p-3 text-[9px] leading-4 text-[#82602d]">Cuenta inicial: admin@buenplato.cl · La contraseña se encuentra en la memoria del proyecto.</p>
        </form>
      </section>
    </main>
  );
}

/** Estructura compartida: cabecera, navegación responsive y área de contenido. */
function AppShell({
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
  const activeView = view === "new-product" ? "inventory" : view;
  const pageTitle = {
    sales: "Venta",
    inventory: "Inventario",
    finance: "Finanzas",
    "new-product": "Nuevo producto",
  }[view];

  return (
    <div className="min-h-screen bg-[#fbf7ef] text-[#24302b] [background-image:radial-gradient(circle_at_85%_5%,rgba(242,181,68,.12),transparent_23%),radial-gradient(circle_at_10%_90%,rgba(76,147,166,.08),transparent_28%)] lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="relative hidden min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_10%_5%,#c96745_0%,#944257_42%,#653044_100%)] px-5 py-6 text-white shadow-[14px_0_45px_rgba(101,48,68,.18)] lg:flex">
        <span className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full border border-white/8" />
        <span className="pointer-events-none absolute -top-6 -right-4 size-24 rounded-full bg-[#f2b544]/10 blur-xl" />
        <div className="relative flex items-center gap-3 px-2">
          <div className="grid size-11 place-items-center rounded-xl bg-[#e45c3a] text-lg shadow-lg shadow-black/10">
            <Icon name="utensils" />
          </div>
          <div>
            <strong className="block text-[15px] tracking-tight">Buen Plato</strong>
            <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/55">Buffet digital</span>
          </div>
        </div>

        <p className="relative mt-12 px-3 text-[9px] font-extrabold uppercase tracking-[.18em] text-white/40">Menú principal</p>
        <nav className="relative mt-3 space-y-1.5" aria-label="Navegación principal">
          <SidebarItem
            icon="cash-register"
            label="Venta"
            active={activeView === "sales"}
            onClick={() => onNavigate("sales")}
          />
          <SidebarItem
            icon="boxes-stacked"
            label="Inventario"
            active={activeView === "inventory"}
            onClick={() => onNavigate("inventory")}
          />
          <SidebarItem
            icon="chart-line"
            label="Finanzas"
            active={activeView === "finance"}
            onClick={() => onNavigate("finance")}
          />
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

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-[72px] items-center border-b border-white/70 bg-white/80 px-4 shadow-[0_8px_30px_rgba(47,93,80,.06)] backdrop-blur-xl md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#d85d3d] text-sm text-white lg:hidden">
              <Icon name="utensils" />
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-[13px] font-extrabold tracking-[-.02em] text-[#24302b]">Buen Plato</strong>
              <span className="block truncate text-[9px] font-bold uppercase tracking-[.14em] text-[#8b918c]">
                Buffet digital · {pageTitle}
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-right md:block">
              <strong className="block text-[11px] text-[#2f5d50]">Servicio de almuerzo</strong>
              <small className="text-[10px] text-[#89928d]">Local abierto · Turno actual</small>
            </span>
            <button className="relative ml-2 grid size-10 place-items-center rounded-xl border border-[#dfe2de] bg-white text-[#526159]" aria-label="Notificaciones">
              <Icon name="bell" />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-[#e45c3a]" />
            </button>
            <button className="grid size-10 place-items-center rounded-xl border border-[#f0d9d2] bg-[#fff5f1] text-[#c94c30] lg:hidden" onClick={onLogout} aria-label="Cerrar sesión">
              <Icon name="right-from-bracket" />
            </button>
          </div>
        </header>
        <main className="px-4 pt-6 pb-28 md:px-8 md:py-8 xl:px-10">{children}</main>

        <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-3 rounded-[22px] border border-white/80 bg-white/85 p-1.5 shadow-[0_18px_50px_rgba(31,68,58,.22)] backdrop-blur-xl lg:hidden" aria-label="Navegación móvil">
          <MobileNavItem icon="cash-register" label="Venta" active={activeView === "sales"} onClick={() => onNavigate("sales")} />
          <MobileNavItem icon="boxes-stacked" label="Inventario" active={activeView === "inventory"} onClick={() => onNavigate("inventory")} />
          <MobileNavItem icon="chart-line" label="Finanzas" active={activeView === "finance"} onClick={() => onNavigate("finance")} />
        </nav>
      </div>
    </div>
  );
}

function MobileNavItem({
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
        active ? "bg-[#d85d3d] text-white shadow-sm" : "text-[#7b857f]"
      }`}
    >
      <Icon name={icon} className="text-sm" />
      {label}
    </button>
  );
}

function SidebarItem({
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
      className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-semibold transition ${
        active ? "bg-white/95 text-[#994353] shadow-[0_8px_25px_rgba(65,25,39,.18)]" : "text-white/65 hover:bg-white/8 hover:text-white"
      }`}
    >
      <Icon name={icon} className={`w-4 ${active ? "text-[#f2b544]" : "text-white/40"}`} />
      {label}
      {active && <span className="ml-auto size-1.5 rounded-full bg-[#e45c3a]" />}
    </button>
  );
}

function StatusPill({ status }: { status: StockStatus }) {
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

/** Consulta, filtra y administra los productos que forman el inventario. */
function InventoryView({
  products,
  categories,
  loading,
  error,
  success,
  search,
  selectedCategory,
  statusFilter,
  onSearch,
  onCategory,
  onStatus,
  onNewProduct,
  onChanged,
}: {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string;
  success: string;
  search: string;
  selectedCategory: string;
  statusFilter: InventoryStatusFilter;
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
  onStatus: (value: InventoryStatusFilter) => void;
  onNewProduct: () => void;
  onChanged: (message: string) => void;
}) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const totalStock = products.reduce((total, product) => total + Number(product.stock), 0);
  const lowStock = products.filter((product) => product.stockStatus === "LOW_STOCK").length;
  const outOfStock = products.filter((product) => product.stockStatus === "OUT_OF_STOCK").length;
  const healthyStock = products.filter((product) => product.stockStatus === "NORMAL").length;
  const inventoryHealth = products.length ? Math.round((healthyStock / products.length) * 100) : 0;
  const visibleProducts = statusFilter
    ? products.filter((product) => product.stockStatus === statusFilter)
    : products;
  const filterLabel = statusFilter === "LOW_STOCK"
    ? "Productos con stock bajo"
    : statusFilter === "OUT_OF_STOCK"
      ? "Productos agotados"
      : "";

  return (
    <div className="mx-auto max-w-[1380px]">
      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#cfe0d3] bg-[#edf5ef] px-4 py-3 text-xs font-semibold text-[#355b43]">
          <Icon name="circle-check" className="text-base" />
          {success}
        </div>
      )}

      <PageHeader
        eyebrow="Centro de control"
        title="Inventario"
        description="Controla existencias, anticipa quiebres de stock y mantén disponible el buffet de hoy."
        icon="boxes-stacked"
        actions={<>
          <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-bold text-white/80">Salud <strong className="ml-1 text-sm text-white">{inventoryHealth}%</strong></span>
          <button className="h-11 rounded-xl border border-white/15 bg-white/10 px-4 text-[10px] font-extrabold text-white backdrop-blur hover:bg-white/15"><Icon name="arrow-down" className="mr-2" />Exportar</button>
          <button className="h-11 rounded-xl bg-saffron px-4 text-[10px] font-extrabold text-[#55370d] shadow-lg shadow-black/10" onClick={onNewProduct}><Icon name="plus" className="mr-2" />Nuevo producto</button>
        </>}
      />

      <section className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard icon="layer-group" label="Productos activos" value={products.length} helper="Mostrar todos" tone="green" active={!statusFilter} onClick={() => onStatus("")} />
        <MetricCard icon="cubes-stacked" label="Unidades disponibles" value={Math.round(totalStock)} helper="Mostrar inventario" tone="blue" active={false} onClick={() => onStatus("")} />
        <MetricCard icon="triangle-exclamation" label="Stock bajo" value={lowStock} helper="Ver alertas" tone="amber" active={statusFilter === "LOW_STOCK"} onClick={() => onStatus(statusFilter === "LOW_STOCK" ? "" : "LOW_STOCK")} />
        <MetricCard icon="circle-xmark" label="Agotados" value={outOfStock} helper="Ver agotados" tone="red" active={statusFilter === "OUT_OF_STOCK"} onClick={() => onStatus(statusFilter === "OUT_OF_STOCK" ? "" : "OUT_OF_STOCK")} />
      </section>

      <section className="mt-7 overflow-hidden rounded-[26px] border border-white/80 bg-white/92 shadow-[0_18px_50px_rgba(47,93,80,.10)] backdrop-blur">
        {statusFilter && (
          <div className="flex items-center justify-between border-b border-[#eadfcf] bg-[#fffaf1] px-4 py-3">
            <span className="flex items-center gap-2 text-[11px] font-extrabold text-[#855b26]">
              <Icon name={statusFilter === "LOW_STOCK" ? "triangle-exclamation" : "circle-xmark"} />
              {filterLabel}
            </span>
            <button className="text-[10px] font-bold text-[#8b6b43] underline underline-offset-2" onClick={() => onStatus("")}>
              Quitar filtro
            </button>
          </div>
        )}
        <div className="border-b border-[#e6e8e5] p-4 md:flex md:items-center md:justify-between md:gap-4">
          <div className="relative flex-1 md:max-w-md">
            <Icon name="magnifying-glass" className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-[#8a948e]" />
            <input
              className="h-10 w-full rounded-xl border border-[#dfe2de] bg-[#fafaf8] pr-3 pl-9 text-xs outline-none transition placeholder:text-[#9ba39f] focus:border-[#6d8678] focus:bg-white focus:ring-4 focus:ring-[#426451]/8"
              type="search"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Buscar por nombre o SKU"
              aria-label="Buscar producto"
            />
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto md:mt-0">
            <FilterButton active={!selectedCategory} onClick={() => onCategory("")}>Todos</FilterButton>
            {categories.map((category) => (
              <FilterButton key={category.id} active={selectedCategory === category.slug} onClick={() => onCategory(category.slug)}>
                {category.name}
              </FilterButton>
            ))}
          </div>
        </div>

        {loading ? (
          <BrandedLoader label="Actualizando inventario" />
        ) : error ? (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            <Icon name="circle-exclamation" className="mr-2" />{error}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#eef0ed] text-[#77837c]"><Icon name="magnifying-glass" /></div>
              <strong className="mt-3 block text-sm">Sin resultados</strong>
              <p className="mt-1 text-xs text-[#7c8781]">
                {statusFilter ? "No hay productos dentro de esta alerta." : "Prueba con otro nombre o categoría."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#fafaf8] text-left text-[9px] font-extrabold uppercase tracking-[.14em] text-[#818b85]">
                    <th className="px-5 py-3.5">Producto</th>
                    <th className="px-4 py-3.5">Categoría</th>
                    <th className="px-4 py-3.5">Existencias</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5 text-right">Precio</th>
                    <th className="w-14 px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => (
                    <ProductRow key={product.id} product={product} onEdit={setEditingProduct} onDelete={setDeletingProduct} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-[#e7e9e6] md:hidden">
              {visibleProducts.map((product) => (
                <ProductMobile key={product.id} product={product} onEdit={setEditingProduct} onDelete={setDeletingProduct} />
              ))}
            </div>
          </>
        )}

        <footer className="flex items-center justify-between border-t border-[#e6e8e5] bg-[#fafaf8] px-4 py-3 text-[10px] text-[#7a857f]">
          <span>Mostrando {visibleProducts.length} productos</span>
          <span>Actualizado ahora</span>
        </footer>
      </section>

      <button
        className="fixed right-5 bottom-24 grid size-14 place-items-center rounded-2xl bg-[#e45c3a] text-white shadow-xl lg:hidden"
        type="button"
        onClick={onNewProduct}
        aria-label="Crear producto"
      >
        <Icon name="plus" />
      </button>

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSaved={(updated) => {
            setEditingProduct(null);
            onChanged(`${updated.name} fue actualizado correctamente.`);
          }}
        />
      )}
      {deletingProduct && (
        <DeleteProductDialog
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onDeleted={() => {
            const name = deletingProduct.name;
            setDeletingProduct(null);
            onChanged(`${name} fue eliminado del inventario.`);
          }}
        />
      )}
    </div>
  );
}

function MetricCard({
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
    red: "from-[#e45c3a] to-[#f18868]",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-[22px] border bg-gradient-to-br p-4 text-left transition duration-300 md:p-5 ${surface} ${
        active ? "border-[#2f5d50] ring-2 ring-[#2f5d50]/10" : "border-white hover:-translate-y-1 hover:shadow-xl"
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

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      className={`h-8 shrink-0 rounded-lg px-3 text-[10px] font-bold transition ${
        active ? "bg-[#2f5d50] text-white" : "bg-[#f4eee4] text-[#69756e] hover:bg-[#fff0d5] hover:text-[#ad4c32]"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ProductAvatar({ product }: { product: Product }) {
  const colors: Record<string, string> = {
    proteinas: "bg-[#fde5dc] text-[#c44e30]",
    agregados: "bg-[#e4f0dc] text-[#568044]",
    pan: "bg-[#fff0ca] text-[#9a6800]",
    bebestibles: "bg-[#dff0f3] text-[#39798b]",
    postres: "bg-[#f2e2ea] text-[#934763]",
  };
  return (
    <div className={`grid size-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${colors[product.category.slug] ?? "bg-[#eceeeb] text-[#607067]"}`}>
      {product.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const stockPercentage = product.lowStockThreshold > 0
    ? Math.min(100, (Number(product.stock) / (Number(product.lowStockThreshold) * 3)) * 100)
    : 100;
  return (
    <tr className="group border-t border-[#eceeeb] transition hover:bg-[#fcfcfa]">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <ProductAvatar product={product} />
          <div className="min-w-0">
            <strong className="block truncate text-xs text-[#223128]">{product.name}</strong>
            <span className="mt-0.5 block text-[10px] text-[#8a938e]">{product.sku} · {product.description}</span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-[11px] font-semibold text-[#617068]">{product.category.name}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-baseline gap-1">
          <strong className="text-xs">{Number(product.stock)}</strong>
          <span className="text-[9px] text-[#909893]">{product.unit}</span>
        </div>
        {product.trackStock && (
          <div className="mt-1.5 h-1 w-20 overflow-hidden rounded-full bg-[#e9ebe8]">
            <div
              className={`h-full rounded-full ${product.stockStatus === "OUT_OF_STOCK" ? "bg-[#c85d51]" : product.stockStatus === "LOW_STOCK" ? "bg-[#e0a54a]" : "bg-[#5d8069]"}`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
        )}
      </td>
      <td className="px-4 py-3.5"><StatusPill status={product.stockStatus} /></td>
      <td className="px-4 py-3.5 text-right text-xs font-extrabold text-[#26372e]">{currency.format(product.price)}</td>
      <td className="px-4 py-3.5">
        <div className="flex justify-end gap-1 opacity-70 transition group-hover:opacity-100">
          <button
            className="grid size-8 place-items-center rounded-lg text-[#66736c] transition hover:bg-[#edf0ed] hover:text-[#31483c]"
            aria-label={`Editar ${product.name}`}
            onClick={() => onEdit(product)}
          >
            <Icon name="pen" />
          </button>
          <button
            className="grid size-8 place-items-center rounded-lg text-[#a55b54] transition hover:bg-[#f9e9e7] hover:text-[#963f37]"
            aria-label={`Eliminar ${product.name}`}
            onClick={() => onDelete(product)}
          >
            <Icon name="trash" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function ProductMobile({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  return (
    <article className="p-4">
      <div className="flex items-start gap-3">
        <ProductAvatar product={product} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <strong className="block truncate text-xs">{product.name}</strong>
              <span className="mt-0.5 block text-[10px] text-[#8a938e]">{product.category.name} · {product.sku}</span>
            </div>
            <strong className="shrink-0 text-xs">{currency.format(product.price)}</strong>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <StatusPill status={product.stockStatus} />
            <span className="text-[10px] text-[#78837d]"><strong className="text-xs text-[#26372e]">{Number(product.stock)}</strong> {product.unit}</span>
          </div>
          <div className="mt-3 flex gap-2 border-t border-[#eceeea] pt-3">
            <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#e7f1e4] text-[10px] font-bold text-[#2f5d50]" onClick={() => onEdit(product)}>
              <Icon name="pen" /> Editar
            </button>
            <button className="grid size-9 place-items-center rounded-lg bg-[#faecea] text-[#a44d45]" aria-label={`Eliminar ${product.name}`} onClick={() => onDelete(product)}>
              <Icon name="trash" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Permite actualizar un producto existente sin abandonar el inventario. */
function EditProductDialog({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product;
  categories: Category[];
  onClose: () => void;
  onSaved: (product: Product) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const { data: updated } = await apiClient.put<Product>(`/products/${product.id}`, {
        categoryId: Number(data.get("categoryId")),
        sku: String(data.get("sku") ?? "").trim().toUpperCase(),
        name: String(data.get("name") ?? "").trim(),
        description: String(data.get("description") ?? "").trim(),
        price: Number(data.get("price")),
        unit: String(data.get("unit") ?? ""),
        stock: Number(data.get("stock")),
        lowStockThreshold: Number(data.get("lowStockThreshold")),
        trackStock: data.get("trackStock") === "on",
      });
      onSaved(updated);
    } catch (error) {
      setMessage(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[#1f443a]/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
      <form className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-[#fff8ec] shadow-2xl sm:max-w-2xl sm:rounded-3xl" onSubmit={submit}>
        <header className="sticky top-0 z-10 flex items-center border-b border-[#e2ded3] bg-white px-5 py-4">
          <div>
            <span className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[#e45c3a]">Inventario</span>
            <h2 id="edit-product-title" className="mt-0.5 text-lg font-extrabold text-[#2f5d50]">Editar producto</h2>
          </div>
          <button type="button" className="ml-auto grid size-9 place-items-center rounded-xl bg-[#f1f1ed] text-[#69736d]" onClick={onClose} aria-label="Cerrar edición">
            <Icon name="xmark" />
          </button>
        </header>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Nombre" className="sm:col-span-2">
            <input className={fieldClass} name="name" required maxLength={120} defaultValue={product.name} />
          </Field>
          <Field label="SKU">
            <input className={fieldClass} name="sku" required maxLength={60} defaultValue={product.sku} />
          </Field>
          <Field label="Categoría">
            <select className={fieldClass} name="categoryId" required defaultValue={String(product.category.id)}>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </Field>
          <Field label="Precio">
            <input className={fieldClass} name="price" type="number" min="0" step="1" required defaultValue={product.price} />
          </Field>
          <Field label="Unidad">
            <select className={fieldClass} name="unit" defaultValue={product.unit}>
              <option value="porciones">Porciones</option>
              <option value="unidades">Unidades</option>
              <option value="kilogramos">Kilogramos</option>
              <option value="litros">Litros</option>
            </select>
          </Field>
          <Field label="Stock actual">
            <input className={fieldClass} name="stock" type="number" min="0" step="0.01" required defaultValue={product.stock} />
          </Field>
          <Field label="Alerta de stock bajo">
            <input className={fieldClass} name="lowStockThreshold" type="number" min="0" step="0.01" required defaultValue={product.lowStockThreshold} />
          </Field>
          <Field label="Descripción" className="sm:col-span-2">
            <textarea className={`${fieldClass} min-h-24 py-3`} name="description" maxLength={500} defaultValue={product.description} />
          </Field>
          <label className="flex items-center gap-3 rounded-xl border border-[#dfe2de] bg-white p-4 sm:col-span-2">
            <input className="size-4 accent-[#2f5d50]" type="checkbox" name="trackStock" defaultChecked={product.trackStock} />
            <span>
              <strong className="block text-[11px]">Controlar existencias</strong>
              <small className="text-[10px] text-[#7b857f]">Activa alertas y descuenta stock en las ventas.</small>
            </span>
          </label>
          {message && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 sm:col-span-2">{message}</div>}
        </div>

        <footer className="sticky bottom-0 flex gap-2 border-t border-[#e2ded3] bg-white p-4 sm:justify-end">
          <button type="button" className="h-11 flex-1 rounded-xl border border-[#d8d9d4] px-5 text-xs font-bold text-[#68736d] sm:flex-none" onClick={onClose}>Cancelar</button>
          <button type="submit" disabled={saving} className="h-11 flex-1 rounded-xl bg-[#e45c3a] px-5 text-xs font-bold text-white disabled:opacity-60 sm:flex-none">
            <Icon name={saving ? "spinner" : "floppy-disk"} className={`mr-2 ${saving ? "animate-spin" : ""}`} />
            {saving ? "Guardando" : "Guardar cambios"}
          </button>
        </footer>
      </form>
    </div>
  );
}

/** Solicita confirmación antes de desactivar un producto del catálogo. */
function DeleteProductDialog({
  product,
  onClose,
  onDeleted,
}: {
  product: Product;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function remove() {
    setDeleting(true);
    setMessage("");
    try {
      await apiClient.delete(`/products/${product.id}`);
      onDeleted();
    } catch (error) {
      setMessage(apiErrorMessage(error));
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#1f443a]/45 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-product-title">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="grid size-12 place-items-center rounded-2xl bg-[#fae8e6] text-[#a8473f]"><Icon name="trash" /></div>
        <h2 id="delete-product-title" className="mt-5 text-xl font-extrabold text-[#24302b]">Eliminar producto</h2>
        <p className="mt-2 text-xs leading-5 text-[#727d76]">
          <strong>{product.name}</strong> dejará de aparecer en inventario y ventas. Su historial permanecerá protegido.
        </p>
        {message && <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{message}</div>}
        <div className="mt-6 flex gap-2">
          <button className="h-11 flex-1 rounded-xl border border-[#d8d9d4] text-xs font-bold text-[#68736d]" onClick={onClose}>Cancelar</button>
          <button className="h-11 flex-1 rounded-xl bg-[#a8473f] text-xs font-bold text-white disabled:opacity-60" disabled={deleting} onClick={remove}>
            {deleting ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Registra un producto nuevo con categoría, precio y política de stock. */
function NewProductView({
  categories,
  onCancel,
  onCreated,
}: {
  categories: Category[];
  onCancel: () => void;
  onCreated: (product: Product) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [trackStock, setTrackStock] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!selectedCategory) {
      setMessage("Selecciona una categoría para continuar.");
      return;
    }
    setSaving(true);
    const data = new FormData(event.currentTarget);
    try {
      const { data: created } = await apiClient.post<Product>("/products", {
        categoryId: Number(selectedCategory),
        sku: String(data.get("sku") ?? "").trim().toUpperCase(),
        name: String(data.get("name") ?? "").trim(),
        description: String(data.get("description") ?? "").trim(),
        price: Number(data.get("price")),
        unit: data.get("unit"),
        stock: Number(data.get("stock")),
        lowStockThreshold: Number(data.get("lowStockThreshold")),
        trackStock,
      });
      onCreated(created);
    } catch (error) {
      setMessage(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Alta de catálogo"
        title="Nuevo producto"
        description="Registra la información comercial y define cómo se controlará su inventario."
        icon="box-open"
        actions={
          <button className="h-11 rounded-xl border border-white/15 bg-white/10 px-4 text-[10px] font-extrabold text-white backdrop-blur hover:bg-white/15" onClick={onCancel}>
            <Icon name="arrow-left" className="mr-2" />Volver al inventario
          </button>
        }
      />

      <form className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]" onSubmit={submit}>
        <div className="space-y-5">
          <FormSection number="01" title="Información básica" subtitle="Datos visibles en inventario, ventas y reportes.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre del producto" className="md:col-span-2">
                <input
                  className={fieldClass}
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={120}
                  placeholder="Ej. Pechuga de pollo grillada"
                />
              </Field>
              <Field label="SKU" hint="Código único de inventario">
                <input className={fieldClass} name="sku" required maxLength={60} placeholder="PRO-002" autoCapitalize="characters" />
              </Field>
              <Field label="Unidad de medida">
                <select className={fieldClass} name="unit" defaultValue="porciones">
                  <option value="porciones">Porciones</option>
                  <option value="unidades">Unidades</option>
                  <option value="kilogramos">Kilogramos</option>
                  <option value="litros">Litros</option>
                </select>
              </Field>
              <Field label="Descripción" className="md:col-span-2" hint="Máximo 500 caracteres">
                <textarea
                  className={`${fieldClass} min-h-28 resize-y py-3`}
                  name="description"
                  maxLength={500}
                  placeholder="Preparación, gramaje o información útil para cocina."
                />
              </Field>
            </div>
          </FormSection>

          <FormSection number="02" title="Categoría" subtitle="Determina dónde aparecerá el producto.">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {categories.map((category) => {
                const active = selectedCategory === String(category.id);
                const icons: Record<string, string> = {
                  proteinas: "drumstick-bite",
                  agregados: "bowl-rice",
                  pan: "bread-slice",
                  bebestibles: "bottle-water",
                  postres: "ice-cream",
                };
                return (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => setSelectedCategory(String(category.id))}
                    className={`relative flex min-h-24 flex-col items-start justify-between rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-[#426451] bg-[#edf2ee] text-[#294334] ring-2 ring-[#426451]/10"
                        : "border-[#dfe2de] bg-white text-[#6b7670] hover:border-[#aeb7b1]"
                    }`}
                  >
                    <Icon name={icons[category.slug] ?? "box"} className={active ? "text-[#426451]" : "text-[#9aa39e]"} />
                    <span className="text-[11px] font-bold">{category.name}</span>
                    {active && <Icon name="circle-check" className="absolute top-3 right-3 text-[11px] text-[#426451]" />}
                  </button>
                );
              })}
            </div>
          </FormSection>

          <FormSection number="03" title="Precio e inventario" subtitle="Valores utilizados en venta y alertas internas.">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Precio de venta">
                <div className="relative">
                  <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs font-bold text-[#758079]">$</span>
                  <input
                    className={`${fieldClass} pl-8`}
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    required
                    placeholder="0"
                  />
                </div>
              </Field>
              <Field label="Stock inicial">
                <input
                  className={fieldClass}
                  name="stock"
                  type="number"
                  min="0"
                  step="0.01"
                  value={stock}
                  onChange={(event) => setStock(event.target.value)}
                  required
                />
              </Field>
              <Field label="Avisar cuando queden">
                <input className={fieldClass} name="lowStockThreshold" type="number" min="0" step="0.01" required defaultValue="5" />
              </Field>
              <label className="flex items-center gap-3 rounded-xl border border-[#dfe2de] bg-[#fafaf8] p-4 md:col-span-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={trackStock}
                  onClick={() => setTrackStock((value) => !value)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${trackStock ? "bg-[#426451]" : "bg-[#c8ceca]"}`}
                >
                  <span className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition ${trackStock ? "left-6" : "left-1"}`} />
                </button>
                <span>
                  <strong className="block text-[11px]">Controlar existencias</strong>
                  <small className="mt-0.5 block text-[10px] text-[#7b857f]">Las ventas descontarán automáticamente este producto.</small>
                </span>
              </label>
            </div>
          </FormSection>

          {message && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700" role="alert">
              <Icon name="circle-exclamation" className="mt-0.5" />
              {message}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-[#dfe2de] pt-5 sm:flex-row sm:justify-end">
            <button className="h-11 rounded-xl border border-[#d2d7d3] bg-white px-5 text-xs font-bold text-[#54635b]" type="button" onClick={onCancel}>
              Cancelar
            </button>
            <button
              className="h-11 rounded-xl bg-[#e45c3a] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#c9472a] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              <Icon name={saving ? "spinner" : "floppy-disk"} className={`mr-2 ${saving ? "animate-spin" : ""}`} />
              {saving ? "Guardando producto" : "Guardar producto"}
            </button>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-[#dfe2de] bg-white">
            <div className="border-b border-[#e5e8e4] bg-[#fafaf8] px-4 py-3">
              <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#858f89]">Vista previa</span>
            </div>
            <div className="p-4">
              <div className="grid aspect-[4/2.3] place-items-center rounded-xl bg-[#edf0eb] text-[#8b9790]">
                <Icon name="image" className="text-2xl" />
              </div>
              <span className="mt-4 block text-[9px] font-extrabold uppercase tracking-wider text-[#e45c3a]">
                {categories.find((category) => String(category.id) === selectedCategory)?.name ?? "Sin categoría"}
              </span>
              <strong className="mt-1 block text-sm">{name || "Nombre del producto"}</strong>
              <div className="mt-4 flex items-end justify-between border-t border-[#eceeeb] pt-3">
                <span>
                  <small className="block text-[9px] uppercase tracking-wider text-[#909993]">Stock inicial</small>
                  <strong className="text-sm">{stock || "0"}</strong>
                </span>
                <strong className="text-sm text-[#294334]">{price ? currency.format(Number(price)) : "$0"}</strong>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-[#2f5d50] p-5 text-white">
            <Icon name="lightbulb" className="text-[#e2a05f]" />
            <strong className="mt-4 block text-xs">Antes de guardar</strong>
            <ul className="mt-3 space-y-2 text-[10px] leading-4 text-white/55">
              <li>• Utiliza un SKU único y fácil de identificar.</li>
              <li>• Define el stock mínimo según el consumo diario.</li>
              <li>• El precio se almacena en pesos chilenos.</li>
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
}

function FormSection({
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
    <section className="rounded-2xl border border-[#dfe2de] bg-white shadow-[0_1px_2px_rgba(20,35,27,.03)]">
      <header className="flex items-start gap-3 border-b border-[#e7e9e6] px-5 py-4">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#e7eee9] text-[9px] font-extrabold text-[#426451]">{number}</span>
        <div>
          <h2 className="m-0 text-sm font-extrabold text-[#223128]">{title}</h2>
          <p className="mt-0.5 text-[10px] text-[#88918c]">{subtitle}</p>
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({
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
      <span className="flex items-center justify-between text-[10px] font-bold text-[#536159]">
        {label}
        {hint && <small className="font-normal text-[#9aa29e]">{hint}</small>}
      </span>
      {children}
    </label>
  );
}

/**
 * Punto de venta buffet.
 * Separa la cantidad de menús de su composición, calcula recargos una sola vez
 * y envía al backend una línea agrupada con sus productos individuales.
 */
function SalesView() {
  const [catalog, setCatalog] = useState<SalesCatalog | null>(null);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [editingMenuKey, setEditingMenuKey] = useState<string | null>(null);
  const [showIndividualProducts, setShowIndividualProducts] = useState(false);
  const [individualCategory, setIndividualCategory] = useState("");
  const [menuQuantity, setMenuQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<number, Record<number, number>>>({});
  const [menuLines, setMenuLines] = useState<MenuCartLine[]>([]);
  const [extras, setExtras] = useState<Record<number, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [serviceType, setServiceType] = useState("TAKEAWAY");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [editingOrder, setEditingOrder] = useState<OrderHistory | null>(null);

  const loadCatalog = useCallback(() => {
    setLoading(true);
    setError("");
    apiClient.get<SalesCatalog>("/sales/catalog")
      .then(({ data }) => {
        setCatalog(data);
      })
      .catch((requestError) => setError(apiErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadCatalog, [loadCatalog]);

  async function openHistory() {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get<OrderHistory[]>("/orders");
      setOrders(data);
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function saveOrderChanges() {
    if (!editingOrder) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await apiClient.put<OrderHistory>(`/orders/${editingOrder.id}`, {
        customerName: editingOrder.customerName,
        serviceType: editingOrder.serviceType,
        status: editingOrder.status,
        paymentMethod: editingOrder.paymentMethod,
        notes: editingOrder.notes,
      });
      setOrders((current) => current.map((order) => order.id === data.id ? data : order));
      setEditingOrder(null);
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  const selectedMenu = catalog?.menus.find((menu) => menu.id === selectedMenuId) ?? null;
  const extrasTotal = catalog?.additionalProducts.reduce(
    (total, product) => total + product.price * (extras[product.id] ?? 0),
    0,
  ) ?? 0;
  const builderExtrasPerMenu = selectedMenu?.sections.reduce((sectionTotal, section) => {
    let includedRemaining = section.maximumSelections;
    const optionTotal = section.options.reduce((sum, option) => {
      const quantity = selections[section.id]?.[option.id] ?? 0;
      const included = Math.min(includedRemaining, quantity);
      const extraUnits = quantity - included;
      includedRemaining -= included;
      return sum + option.extraPrice * quantity + option.price * extraUnits;
    }, 0);
    return sectionTotal + optionTotal;
  }, 0) ?? 0;
  // La cantidad replica el menú base; los recargos pertenecen a esta configuración y se cobran una vez.
  const builderPrice = (selectedMenu?.basePrice ?? 0) * menuQuantity + builderExtrasPerMenu;
  const total = menuLines.reduce((sum, line) => sum + line.totalPrice, 0) + extrasTotal;
  const menuIsComplete = selectedMenu
    ? selectedMenu.sections.every((section) => {
        const count = Object.values(selections[section.id] ?? {}).reduce((sum, quantity) => sum + quantity, 0);
        const stockIsEnough = section.options.every((option) =>
          (selections[section.id]?.[option.id] ?? 0) * menuQuantity <= Math.floor(option.stock)
        );
        return count >= section.minimumSelections && stockIsEnough;
      })
    : true;
  const hasExtra = Object.values(extras).some((quantity) => quantity > 0);
  const canSubmit = Boolean(menuLines.length || hasExtra) && !saving;
  const productGroups = Object.values(
    (catalog?.additionalProducts ?? []).reduce<Record<string, { name: string; products: SaleProduct[] }>>(
      (groups, product) => {
        const group = groups[product.categorySlug] ?? { name: product.category, products: [] };
        group.products.push(product);
        groups[product.categorySlug] = group;
        return groups;
      },
      {},
    ),
  );
  const filteredProductGroups = individualCategory
    ? productGroups.filter((group) => group.products[0]?.categorySlug === individualCategory)
    : productGroups;

  function chooseMenu(menuId: number) {
    setSelectedMenuId(menuId);
    setEditingMenuKey(null);
    setShowIndividualProducts(false);
    setMenuQuantity(1);
    setSelections({});
    setCreatedOrder(null);
    setError("");
  }

  function changeOptionQuantity(section: SaleSection, option: SaleOption, delta: number) {
    setSelections((current) => {
      const sectionSelections = current[section.id] ?? {};
      const currentQuantity = sectionSelections[option.id] ?? 0;
      const nextQuantity = delta > 0
        ? Math.min(currentQuantity + 1, Math.floor(option.stock / menuQuantity))
        : Math.max(0, currentQuantity - 1);
      return {
        ...current,
        [section.id]: { ...sectionSelections, [option.id]: nextQuantity },
      };
    });
  }

  function extraUnitsForOption(section: SaleSection, optionId: number) {
    let includedRemaining = section.maximumSelections;
    for (const option of section.options) {
      const quantity = selections[section.id]?.[option.id] ?? 0;
      const included = Math.min(includedRemaining, quantity);
      includedRemaining -= included;
      if (option.id === optionId) return quantity - included;
    }
    return 0;
  }

  function addConfiguredMenu() {
    if (!selectedMenu || !menuIsComplete) return;
    const selectionCopy = Object.fromEntries(
      selectedMenu.sections.map((section) => [
        section.id,
        { ...(selections[section.id] ?? {}) },
      ]),
    );
    const key = String(selectedMenu.id);
    const configuredLine = {
      key: editingMenuKey ?? `${key}-${Date.now()}`,
      menu: selectedMenu,
      selections: selectionCopy,
      quantity: menuQuantity,
      totalPrice: builderPrice,
    };
    setMenuLines((current) => editingMenuKey
      ? current.map((line) => line.key === editingMenuKey ? configuredLine : line)
      : [...current, configuredLine]);
    setSelectedMenuId(null);
    setEditingMenuKey(null);
    setShowIndividualProducts(false);
    setMenuQuantity(1);
    setSelections({});
  }

  function removeMenu(key: string) {
    setMenuLines((current) => current.filter((line) => line.key !== key));
  }

  function editMenu(line: MenuCartLine) {
    setSelectedMenuId(line.menu.id);
    setEditingMenuKey(line.key);
    setShowIndividualProducts(false);
    setMenuQuantity(line.quantity);
    setSelections(line.selections);
  }

  function changeExtra(productId: number, delta: number, available: number) {
    setExtras((current) => ({
      ...current,
      [productId]: Math.max(0, Math.min(Math.floor(available), (current[productId] ?? 0) + delta)),
    }));
  }

  async function createOrder() {
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    setCreatedOrder(null);
    try {
      const { data } = await apiClient.post<CreatedOrder>("/orders", {
        menus: menuLines.map((line) => ({
          menuId: line.menu.id,
          quantity: line.quantity,
          selections: line.menu.sections.map((section) => ({
            sectionId: section.id,
            options: Object.entries(line.selections[section.id] ?? {})
              .filter(([, quantity]) => quantity > 0)
              .map(([optionId, quantity]) => ({
                optionId: Number(optionId),
                quantity,
              })),
          })),
        })),
        extras: Object.entries(extras)
          .filter(([, quantity]) => quantity > 0)
          .map(([productId, quantity]) => ({ productId: Number(productId), quantity })),
        customerName: customerName.trim() || null,
        serviceType,
        paymentMethod,
        notes: notes.trim() || null,
      });
      setCreatedOrder(data);
      setSelections({});
      setMenuQuantity(1);
      setMenuLines([]);
      setExtras({});
      setCustomerName("");
      setNotes("");
      setMobileSummaryOpen(false);
      loadCatalog();
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (loading && !catalog) {
    return <BrandedLoader label="Preparando punto de venta" />;
  }

  return (
    <div className="mx-auto max-w-[1380px]">
      {createdOrder && (
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-[#c8dfc1] bg-[#edf7e9] p-4 text-[#315b35] shadow-[0_10px_30px_rgba(71,114,61,.10)]">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#7fa35c] text-white"><Icon name="check" /></div>
          <div>
            <strong className="block text-sm">Venta registrada correctamente</strong>
            <span className="mt-0.5 block text-[11px]">Pedido {createdOrder.orderNumber} · {currency.format(createdOrder.total)}</span>
          </div>
        </div>
      )}

      <PageHeader
        eyebrow="Caja abierta"
        title="Nueva venta"
        description="Arma el pedido buffet o agrega productos individuales."
        icon="utensils"
        actions={
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={openHistory} className="h-11 rounded-xl border border-white/15 bg-white/10 px-4 text-[10px] font-extrabold text-white backdrop-blur hover:bg-white/15">
            <Icon name="clock-rotate-left" className="mr-2 text-[#ffe19a]" />Historial de ventas
          </motion.button>
        }
      />

      {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700"><Icon name="circle-exclamation" className="mr-2" />{error}</div>}

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className={selectedMenu ? "fixed inset-0 z-[60] space-y-5 overflow-y-auto bg-[#f7f2ea] p-4 pb-24 sm:p-6 xl:px-[max(2rem,calc((100vw-980px)/2))]" : "space-y-5"}>
          <div className={`rounded-[24px] border border-white bg-white/95 p-5 shadow-[0_18px_45px_rgba(47,93,80,.09)] ${selectedMenu ? "hidden" : ""}`}>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#e45c3a]">01 · Menú</span>
                <h2 className="mt-1 text-lg font-extrabold text-[#24302b]">¿Qué deseas agregar?</h2>
              </div>
              <span className="text-[10px] text-[#87918b]">Menú o producto suelto</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {catalog?.menus.map((menu) => {
                const active = selectedMenuId === menu.id;
                return (
                  <button key={menu.id} onClick={() => chooseMenu(menu.id)} className={`rounded-2xl border p-4 text-left transition ${active ? "border-[#d85d3d] bg-[#fff0e5] ring-2 ring-[#d85d3d]/10" : "border-[#e8e2d8] bg-[#fcfaf6] hover:border-[#f2b544]"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid size-10 place-items-center rounded-xl bg-[#d85d3d] text-white"><Icon name="bowl-food" /></div>
                      {active && <Icon name="circle-check" className="text-[#5c874e]" />}
                    </div>
                    <strong className="mt-4 block text-sm">{menu.name}</strong>
                    <span className="mt-1 block text-[10px] leading-4 text-[#7a847e]">{menu.description}</span>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <strong className="text-sm text-[#e45c3a]">{currency.format(menu.basePrice)}</strong>
                      <span className="rounded-lg bg-[#d85d3d] px-2.5 py-1.5 text-[9px] font-extrabold text-white">
                        <Icon name="plus" className="mr-1.5" />Configurar menú
                      </span>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setSelectedMenuId(null);
                  setEditingMenuKey(null);
                  setSelections({});
                  setMenuQuantity(1);
                  setShowIndividualProducts(true);
                }}
                className={`rounded-2xl border p-4 text-left transition ${showIndividualProducts ? "border-[#9a4965] bg-[#fbf0f4] ring-2 ring-[#9a4965]/10" : "border-[#e8e2d8] bg-[#fcfaf6] hover:border-[#f2b544]"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid size-10 place-items-center rounded-xl bg-[#9a4965] text-white"><Icon name="basket-shopping" /></div>
                  {showIndividualProducts && <Icon name="circle-check" className="text-[#9a4965]" />}
                </div>
                <strong className="mt-4 block text-sm">Producto individual</strong>
                <span className="mt-1 block text-[10px] leading-4 text-[#7a847e]">Vende proteínas, agregados, ensaladas, postres, bebidas o extras por separado.</span>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <strong className="text-sm text-[#9a4965]">{catalog?.additionalProducts.length ?? 0} opciones</strong>
                  <span className="rounded-lg bg-[#9a4965] px-2.5 py-1.5 text-[9px] font-extrabold text-white">
                    <Icon name="plus" className="mr-1.5" />Ver productos
                  </span>
                </div>
              </button>
            </div>
          </div>

          {selectedMenu && (
            <div className="overflow-hidden rounded-[24px] border border-[#f0d8a4] bg-[linear-gradient(145deg,#fffaf0,#fff3dc)] p-4 shadow-[0_16px_35px_rgba(161,113,25,.08)] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#f2b544] text-[#5c4216] shadow-[0_8px_20px_rgba(242,181,68,.25)]">
                    <Icon name="utensils" />
                  </div>
                  <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#b16b17]">{editingMenuKey ? "Editando menú" : "Nuevo menú"}</span>
                    <button
                      className="text-[9px] font-bold text-[#8a7462] underline underline-offset-2"
                      onClick={() => {
                        setSelectedMenuId(null);
                        setEditingMenuKey(null);
                        setMenuQuantity(1);
                        setSelections({});
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                  <h2 className="mt-1 text-base font-extrabold">¿Cuántos menús vas a preparar?</h2>
                  <p className="mt-1 text-[10px] leading-4 text-[#7c776d]">
                    La composición se elige una vez; la cantidad multiplica el mismo menú y su inventario.
                  </p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#ead3aa] bg-white p-2 shadow-[0_8px_24px_rgba(112,78,23,.08)] sm:w-auto sm:self-auto">
                  <button
                    className="grid size-12 place-items-center rounded-xl bg-[#f4eee2] text-base text-[#59645e] active:scale-95 disabled:opacity-30 sm:size-10"
                    disabled={menuQuantity === 1}
                    onClick={() => setMenuQuantity((quantity) => Math.max(1, quantity - 1))}
                    aria-label="Quitar un menú"
                  >
                    <Icon name="minus" />
                  </button>
                  <div className="min-w-20 flex-1 text-center sm:flex-none">
                    <strong className="block text-2xl text-[#994353] sm:text-xl">{menuQuantity}</strong>
                    <span className="block text-[8px] font-bold uppercase tracking-[.12em] text-[#8a918c]">menús</span>
                  </div>
                  <button
                    className="grid size-12 place-items-center rounded-xl bg-[#e45c3a] text-base text-white shadow-[0_8px_18px_rgba(228,92,58,.25)] active:scale-95 disabled:opacity-30 sm:size-10"
                    disabled={menuQuantity >= 20}
                    onClick={() => setMenuQuantity((quantity) => Math.min(20, quantity + 1))}
                    aria-label="Agregar un menú"
                  >
                    <Icon name="plus" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedMenu?.sections.map((section, index) => {
            const sectionSelections = selections[section.id] ?? {};
            const selectedCount = Object.values(sectionSelections).reduce((sum, quantity) => sum + quantity, 0);
            const minimumRequired = section.minimumSelections;
            const includedQuantity = section.maximumSelections;
            const extraCount = Math.max(0, selectedCount - includedQuantity);
            return (
              <div key={section.id} className="rounded-[24px] border border-white bg-white/95 p-5 shadow-[0_18px_45px_rgba(47,93,80,.08)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#4c93a6]">0{index + 2} · {section.required ? "Obligatorio" : "Opcional"}</span>
                    <h2 className="mt-1 text-base font-extrabold">{section.label}</h2>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${selectedCount >= minimumRequired ? "bg-[#fff0df] text-[#a64f32]" : "bg-[#fff0c8] text-[#8a5b00]"}`}>
                    {extraCount > 0 ? `${includedQuantity} incluidas · ${extraCount} extra` : `${selectedCount}/${includedQuantity} incluidas`}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {section.options.map((option) => {
                    const optionQuantity = sectionSelections[option.id] ?? 0;
                    const active = optionQuantity > 0;
                    const canAdd = optionQuantity < Math.floor(option.stock / menuQuantity);
                    const extraUnits = extraUnitsForOption(section, option.id);
                    return (
                      <article key={option.id} className={`relative min-h-32 rounded-2xl border p-3 transition ${active ? "border-[#d85d3d] bg-[#fff0e5] shadow-[0_10px_25px_rgba(216,93,61,.12)]" : "border-[#e8e2d8] bg-[#fcfaf7] hover:-translate-y-0.5 hover:border-[#f2b544]"}`}>
                        <div className="flex items-start justify-between">
                          <div className="grid size-8 place-items-center rounded-xl bg-white text-[#994353] shadow-sm"><Icon name={section.categorySlug === "proteinas" ? "drumstick-bite" : section.categorySlug === "postres" ? "ice-cream" : section.categorySlug === "ensaladas" ? "leaf" : "bowl-rice"} /></div>
                          <div className="flex items-center gap-1.5">
                            <button
                              className="grid size-7 place-items-center rounded-lg bg-white text-[#637068] shadow-sm disabled:opacity-30"
                              disabled={optionQuantity === 0}
                              onClick={() => changeOptionQuantity(section, option, -1)}
                              aria-label={`Quitar ${option.name}`}
                            >
                              <Icon name="minus" />
                            </button>
                            <strong className="w-5 text-center text-xs text-[#994353]">{optionQuantity}</strong>
                            <button
                              className="grid size-7 place-items-center rounded-lg bg-[#994353] text-white shadow-sm disabled:opacity-30"
                              disabled={!canAdd}
                              onClick={() => changeOptionQuantity(section, option, 1)}
                              aria-label={`Agregar ${option.name}`}
                            >
                              <Icon name="plus" />
                            </button>
                          </div>
                        </div>
                        <strong className="mt-3 block text-[11px]">{option.name}</strong>
                        <span className="mt-0.5 block text-[9px] text-[#8b938e]">{option.description}</span>
                        <span className="mt-2 block text-[10px] font-extrabold text-[#e45c3a]">
                          {extraUnits > 0
                            ? `${extraUnits} extra · +${currency.format(option.price * extraUnits)}`
                            : option.extraPrice
                              ? `+${currency.format(option.extraPrice)} por selección`
                              : "Incluido"}
                        </span>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {selectedMenu && (
            <div className="flex flex-col gap-4 rounded-[24px] border border-[#cfe0c9] bg-[linear-gradient(115deg,#edf6e9,#fffaf0)] p-5 shadow-[0_16px_35px_rgba(47,93,80,.09)] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#5c874e]">Menú configurado</span>
                <strong className="mt-1 block text-base">{currency.format(builderPrice)}</strong>
                <span className="mt-1 block text-[10px] text-[#748078]">{menuQuantity} menús agrupados en una sola línea del pedido.</span>
              </div>
              <button
                disabled={!menuIsComplete}
                onClick={addConfiguredMenu}
                className="h-12 rounded-xl bg-[#d85d3d] px-5 text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(216,93,61,.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="cart-plus" className="mr-2" />
                Guardar {menuQuantity === 1 ? "menú" : `${menuQuantity} menús`}
              </button>
            </div>
          )}

          {showIndividualProducts && <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="individual-products-title">
            <button className="absolute inset-0 bg-[#34251d]/35 backdrop-blur-[3px]" onClick={() => setShowIndividualProducts(false)} aria-label="Cerrar productos individuales" />
            <div className="relative flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[30px] border border-white bg-[#fffdf9] shadow-[0_-20px_60px_rgba(58,39,26,.22)] sm:rounded-[30px]">
            <div className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-[#ddd2c5] sm:hidden" />
            <div className="flex items-start justify-between gap-4 border-b border-[#eee4d8] p-5">
              <div>
            <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#9a4965]">Venta directa</span>
            <h2 id="individual-products-title" className="mt-1 text-lg font-extrabold">Productos individuales</h2>
            <p className="mt-1 text-[10px] text-[#7c8580]">También puedes vender una proteína, agregado, ensalada, postre, bebida o extra sin incluir un menú.</p>
              </div>
              <button className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5eee8] text-[#615951]" onClick={() => setShowIndividualProducts(false)} aria-label="Cerrar"><Icon name="xmark" /></button>
            </div>
            <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-[#eee4d8] bg-white px-5 py-3 [scrollbar-width:none]">
              <button
                onClick={() => setIndividualCategory("")}
                className={`shrink-0 rounded-full px-3 py-2 text-[9px] font-extrabold transition ${individualCategory === "" ? "bg-brand text-white shadow-sm" : "bg-[#f7f2ec] text-muted"}`}
              >
                Todos · {catalog?.additionalProducts.length ?? 0}
              </button>
              {productGroups.map((group) => {
                const slug = group.products[0]?.categorySlug ?? "";
                return (
                  <button
                    key={slug}
                    onClick={() => setIndividualCategory(slug)}
                    className={`shrink-0 rounded-full px-3 py-2 text-[9px] font-extrabold transition ${individualCategory === slug ? "bg-brand text-white shadow-sm" : "bg-[#f7f2ec] text-muted"}`}
                  >
                    {group.name} · {group.products.length}
                  </button>
                );
              })}
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {filteredProductGroups.map((group) => (
                <div key={group.name}>
                  <h3 className="mb-2 text-[9px] font-extrabold uppercase tracking-[.14em] text-[#68746d]">{group.name}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.products.map((product) => {
                      const quantity = extras[product.id] ?? 0;
                      return (
                        <article key={product.id} className={`flex items-center gap-3 rounded-2xl border p-3 transition ${quantity > 0 ? "border-[#cba9b6] bg-[#fbf0f4]" : "border-[#e8e2d8] bg-[#fcfaf7]"}`}>
                          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e3f1f4] text-[#39798b]"><Icon name={product.categorySlug === "bebestibles" ? "bottle-water" : product.categorySlug === "proteinas" ? "drumstick-bite" : product.categorySlug === "ensaladas" ? "leaf" : product.categorySlug === "postres" ? "ice-cream" : "bowl-rice"} /></div>
                          <div className="min-w-0 flex-1">
                            <strong className="block truncate text-[11px]">{product.name}</strong>
                            <span className="text-[10px] font-bold text-[#e45c3a]">{currency.format(product.price)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="grid size-8 place-items-center rounded-lg bg-white text-[#637068] shadow-sm disabled:opacity-30" disabled={quantity === 0} onClick={() => changeExtra(product.id, -1, product.stock)} aria-label={`Quitar ${product.name}`}><Icon name="minus" /></button>
                            <strong className="w-4 text-center text-xs">{quantity}</strong>
                            <button className="grid size-8 place-items-center rounded-lg bg-[#9a4965] text-white shadow-sm disabled:opacity-30" disabled={quantity >= product.stock} onClick={() => changeExtra(product.id, 1, product.stock)} aria-label={`Agregar ${product.name}`}><Icon name="plus" /></button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#eee4d8] bg-white p-4">
              <button className="h-12 w-full rounded-xl bg-[#9a4965] text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(154,73,101,.22)]" onClick={() => setShowIndividualProducts(false)}>
                <Icon name="check" className="mr-2" />Listo, continuar con el pedido
              </button>
            </div>
            </div>
          </div>}
        </div>

        {historyOpen && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#34251d]/35 backdrop-blur-[3px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="sales-history-title">
            <div className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[30px] bg-[#fffdf9] shadow-[0_-20px_70px_rgba(58,39,26,.28)] sm:rounded-[30px]">
              <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-[#ddd2c5] sm:hidden" />
              <header className="flex items-start justify-between gap-4 border-b border-[#eee4d8] p-5">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#e45c3a]">Control de ventas</span>
                  <h2 id="sales-history-title" className="mt-1 text-xl font-extrabold">Historial de ventas</h2>
                  <p className="mt-1 text-[10px] text-[#7c8580]">Últimas 100 ventas registradas en el backend.</p>
                </div>
                <button className="grid size-10 place-items-center rounded-xl bg-[#f5eee8] text-[#615951]" onClick={() => { setHistoryOpen(false); setEditingOrder(null); }} aria-label="Cerrar historial"><Icon name="xmark" /></button>
              </header>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                {historyLoading && <BrandedLoader label="Cargando ventas" />}
                {!historyLoading && orders.length === 0 && <div className="grid min-h-48 place-items-center text-xs text-[#7c8580]">Todavía no hay ventas registradas.</div>}
                {!historyLoading && <div className="space-y-3">
                  {orders.map((order) => (
                    <article key={order.id} className="rounded-2xl border border-[#e8e0d5] bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-sm">{order.orderNumber}</strong>
                            <span className="rounded-full bg-[#edf5eb] px-2 py-1 text-[8px] font-extrabold text-[#527247]">{order.status}</span>
                          </div>
                          <span className="mt-1 block text-[10px] text-[#818a84]">{new Date(order.createdAt).toLocaleString("es-CL")} · {order.customerName || "Cliente sin nombre"}</span>
                        </div>
                        <div className="text-right">
                          <strong className="block text-base text-[#e45c3a]">{currency.format(order.total)}</strong>
                          <button onClick={() => setEditingOrder({ ...order })} className="mt-1 text-[10px] font-extrabold text-[#2f5d50]"><Icon name="pen" className="mr-1.5" />Modificar</button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.items.map((item, index) => <span key={`${item.itemName}-${index}`} className="rounded-lg bg-[#f7f2ea] px-2.5 py-1.5 text-[9px] text-[#665f59]">{item.quantity} × {item.itemName}</span>)}
                      </div>
                    </article>
                  ))}
                </div>}
              </div>
            </div>
          </div>
        )}

        {editingOrder && (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#34251d]/45 backdrop-blur-[3px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="edit-sale-title">
            <div className="w-full max-w-lg rounded-t-[30px] bg-white p-5 shadow-[0_-20px_70px_rgba(58,39,26,.30)] sm:rounded-[30px]">
              <div className="flex items-start justify-between">
                <div><span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#e45c3a]">Editar venta</span><h2 id="edit-sale-title" className="mt-1 text-lg font-extrabold">{editingOrder.orderNumber}</h2></div>
                <button className="grid size-9 place-items-center rounded-xl bg-[#f5eee8]" onClick={() => setEditingOrder(null)}><Icon name="xmark" /></button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field label="Cliente" className="sm:col-span-2"><input className={fieldClass} value={editingOrder.customerName ?? ""} onChange={(event) => setEditingOrder({ ...editingOrder, customerName: event.target.value })} /></Field>
                <Field label="Servicio"><select className={fieldClass} value={editingOrder.serviceType} onChange={(event) => setEditingOrder({ ...editingOrder, serviceType: event.target.value })}><option value="TAKEAWAY">Para llevar</option><option value="DINE_IN">Consumir aquí</option></select></Field>
                <Field label="Medio de pago"><select className={fieldClass} value={editingOrder.paymentMethod} onChange={(event) => setEditingOrder({ ...editingOrder, paymentMethod: event.target.value })}><option value="CASH">Efectivo</option><option value="CARD">Tarjeta</option><option value="TRANSFER">Transferencia</option></select></Field>
                <Field label="Estado" className="sm:col-span-2"><select className={fieldClass} value={editingOrder.status} onChange={(event) => setEditingOrder({ ...editingOrder, status: event.target.value })}><option value="PAID">Pagado</option><option value="PREPARING">En preparación</option><option value="COMPLETED">Completado</option></select></Field>
                <Field label="Notas" className="sm:col-span-2"><textarea className={`${fieldClass} min-h-24 py-3`} value={editingOrder.notes ?? ""} onChange={(event) => setEditingOrder({ ...editingOrder, notes: event.target.value })} /></Field>
              </div>
              <button disabled={saving} onClick={saveOrderChanges} className="mt-5 h-12 w-full rounded-xl bg-[#2f5d50] text-xs font-extrabold text-white disabled:opacity-50"><Icon name={saving ? "spinner" : "check"} className={`mr-2 ${saving ? "animate-spin" : ""}`} />Guardar cambios</button>
            </div>
          </div>
        )}

        {mobileSummaryOpen && (
          <button
            className="fixed inset-0 z-40 bg-[#34251d]/35 backdrop-blur-[3px] xl:hidden"
            onClick={() => setMobileSummaryOpen(false)}
            aria-label="Cerrar resumen del pedido"
          />
        )}
        {!mobileSummaryOpen && (menuLines.length > 0 || hasExtra) && (
          <button
            className="fixed bottom-[88px] right-4 z-30 flex items-center gap-3 rounded-2xl bg-[#e45c3a] px-4 py-3 text-left text-white shadow-[0_14px_35px_rgba(142,45,25,.30)] xl:hidden"
            onClick={() => setMobileSummaryOpen(true)}
          >
            <span className="grid size-9 place-items-center rounded-xl bg-white/15"><Icon name="basket-shopping" /></span>
            <span>
              <span className="block text-[9px] font-bold uppercase tracking-[.12em] text-white/75">Ver pedido</span>
              <strong className="block text-sm">{currency.format(total)}</strong>
            </span>
            <span className="grid size-7 place-items-center rounded-lg bg-white text-[#e45c3a]"><Icon name="chevron-up" /></span>
          </button>
        )}
        {(menuLines.length > 0 || hasExtra) && <aside className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 xl:sticky xl:inset-auto xl:top-24 xl:z-auto xl:self-start xl:translate-y-0 ${mobileSummaryOpen ? "translate-y-0" : "pointer-events-none translate-y-full xl:pointer-events-auto"}`}>
          <div className="max-h-[90dvh] overflow-hidden rounded-t-[30px] border border-[#eadbc5] bg-[#fffdf8] text-[#29342f] shadow-[0_-20px_60px_rgba(79,55,30,.25)] xl:max-h-none xl:rounded-[26px] xl:shadow-[0_20px_55px_rgba(79,55,30,.20)]">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-[#ddd2c5] xl:hidden" />
            <button
              className="flex w-full items-center justify-between border-b border-[#eee2d1] p-4 text-left xl:cursor-default xl:p-5"
              onClick={() => setMobileSummaryOpen(false)}
            >
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#d95636]">Resumen del pedido</span>
                <h2 className="mt-1 text-xl font-extrabold">Total {currency.format(total)}</h2>
              </div>
              <div className="flex items-center gap-3 xl:hidden">
                <span className="rounded-full bg-[#fff0d5] px-2.5 py-1 text-[9px] font-extrabold text-[#9b6018]">
                  {menuLines.length + Object.values(extras).filter((quantity) => quantity > 0).length} ítems
                </span>
                <span className="grid size-9 place-items-center rounded-xl bg-[#e45c3a] text-white">
                  <Icon name="xmark" />
                </span>
              </div>
            </button>
            <div className="max-h-[calc(90dvh-84px)] overflow-y-auto xl:max-h-none xl:overflow-visible">
            <div className="max-h-64 space-y-3 overflow-y-auto p-5 text-[11px]">
              {menuLines.map((line) => (
                <div key={line.key} className="rounded-xl border border-[#eee2d2] bg-[#fff8ed] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span><strong>{line.quantity} ×</strong> {line.menu.name}</span>
                    <strong>{currency.format(line.totalPrice)}</strong>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="rounded-lg bg-white px-2.5 py-1.5 text-[9px] font-bold text-[#506058] shadow-sm" onClick={() => editMenu(line)}><Icon name="pen" className="mr-1.5" />Editar</button>
                    <button className="rounded-lg bg-[#fde6df] px-2.5 py-1.5 text-[9px] font-bold text-[#b64227]" onClick={() => removeMenu(line.key)}><Icon name="trash" className="mr-1.5" />Quitar</button>
                    <span className="ml-auto hidden text-[9px] text-[#9b9d97] sm:inline">Cantidades guardadas</span>
                  </div>
                </div>
              ))}
              {catalog?.additionalProducts.filter((product) => (extras[product.id] ?? 0) > 0).map((product) => <div key={product.id} className="flex justify-between gap-4"><span>{extras[product.id]} × {product.name}</span><strong>{currency.format(product.price * extras[product.id])}</strong></div>)}
              {!menuLines.length && !hasExtra && <p className="text-[#929992]">Configura un menú o agrega productos para comenzar.</p>}
            </div>
            <div className="space-y-3 border-t border-[#eee2d1] bg-[#fff8ed] p-5">
              <input className="h-11 w-full rounded-xl border border-[#e5d8c6] bg-white px-3 text-xs text-[#29342f] outline-none placeholder:text-[#a29f98] focus:border-[#e45c3a]" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nombre del cliente (opcional)" />
              <div className="grid grid-cols-2 gap-2">
                <select className="h-11 rounded-xl border border-[#e5d8c6] bg-white px-3 text-xs text-[#29342f] outline-none" value={serviceType} onChange={(event) => setServiceType(event.target.value)}>
                  <option value="TAKEAWAY">Para llevar</option>
                  <option value="DINE_IN">Consumir aquí</option>
                </select>
                <select className="h-11 rounded-xl border border-[#e5d8c6] bg-white px-3 text-xs text-[#29342f] outline-none" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>
              <textarea className="min-h-20 w-full rounded-xl border border-[#e5d8c6] bg-white p-3 text-xs text-[#29342f] outline-none placeholder:text-[#a29f98] focus:border-[#e45c3a]" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas para cocina" maxLength={500} />
              {selectedMenu && !menuIsComplete && <p className="rounded-xl bg-[#fff0cf] p-3 text-[10px] leading-4 text-[#8b5b12]">Completa las cantidades obligatorias del menú antes de guardarlo.</p>}
              <button disabled={!canSubmit} onClick={createOrder} className="h-12 w-full rounded-xl bg-[#e45c3a] text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(142,45,25,.25)] transition hover:bg-[#ef6a48] disabled:cursor-not-allowed disabled:opacity-40">
                <Icon name={saving ? "spinner" : "check"} className={`mr-2 ${saving ? "animate-spin" : ""}`} />
                {saving ? "Registrando venta" : `Confirmar · ${currency.format(total)}`}
              </button>
            </div>
            </div>
          </div>
        </aside>}
      </section>
    </div>
  );
}

/** Presenta métricas financieras del backend y genera reportes PDF/Excel. */
function FinanceView() {
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

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"><Icon name="circle-exclamation" className="mr-2" />{error}</div>}

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
          <article className="rounded-[24px] border border-[#e9e2d7] bg-white p-5">
            <div className="flex items-center justify-between"><div><span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#e45c3a]">Tendencia</span><h2 className="mt-1 text-base font-extrabold">Ventas diarias</h2></div><span className="text-[9px] text-[#8a928d]">{dashboard.dailySales.length} días activos</span></div>
            <div className="mt-5 flex h-52 items-end gap-2 overflow-x-auto border-b border-[#eee7dd] pb-2">
              {dashboard.dailySales.length ? dashboard.dailySales.map((day) => <div key={day.date} className="flex min-w-9 flex-1 flex-col items-center justify-end gap-2"><span className="text-[8px] font-bold">{currency.format(day.revenue)}</span><div className="w-full rounded-t-lg bg-[linear-gradient(180deg,#f2b544,#e45c3a)]" style={{ height: `${Math.max(8, day.revenue / maxDaily * 140)}px` }} /><span className="text-[8px] text-[#969c97]">{day.date.slice(5)}</span></div>) : <p className="m-auto text-xs text-[#949b96]">Sin ventas en el período.</p>}
            </div>
          </article>
          <article className="rounded-[24px] border border-[#e9e2d7] bg-white p-5">
            <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#4c93a6]">Análisis ejecutivo</span><h2 className="mt-1 text-base font-extrabold">Decisiones sugeridas</h2>
            <div className="mt-4 space-y-2">{dashboard.insights.map((insight, index) => <div key={insight} className="flex gap-3 rounded-xl bg-[#f8f7f2] p-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#fff0d2] text-[9px] font-extrabold text-[#a86816]">{index + 1}</span><p className="text-[10px] leading-4 text-[#5f6b64]">{insight}</p></div>)}</div>
          </article>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[24px] border border-[#e9e2d7] bg-white p-5">
            <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#9a4965]">Mezcla comercial</span><h2 className="mt-1 text-base font-extrabold">Ventas por categoría</h2>
            <div className="mt-5 space-y-3">{dashboard.categories.map((category) => <div key={category.label}><div className="flex justify-between text-[10px]"><strong>{category.label}</strong><span>{currency.format(category.amount)} · {category.percentage}%</span></div><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f1ece4]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#9a4965,#e45c3a)]" style={{ width: `${category.percentage}%` }} /></div></div>)}</div>
          </article>
          <article className="rounded-[24px] border border-[#e9e2d7] bg-white p-5">
            <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#4c93a6]">Demanda intradía</span><h2 className="mt-1 text-base font-extrabold">Ventas por hora</h2>
            <div className="mt-5 flex h-40 items-end gap-2">{dashboard.hourlySales.length ? dashboard.hourlySales.map((hour) => <div key={hour.hour} className="flex flex-1 flex-col items-center justify-end gap-2"><div className="w-full rounded-t-md bg-[#4c93a6]" style={{ height: `${Math.max(7, hour.revenue / maxHourly * 105)}px` }} /><span className="text-[8px] text-[#8a928d]">{String(hour.hour).padStart(2, "0")}h</span></div>) : <p className="m-auto text-xs text-[#949b96]">Sin datos horarios.</p>}</div>
          </article>
        </section>

        <section className="mt-5 overflow-hidden rounded-[24px] border border-[#e9e2d7] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#eee7dd] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#5c874e]">Rentabilidad</span><h2 className="mt-1 text-base font-extrabold">Contribución por producto</h2></div>
            <div className="flex gap-2"><button onClick={() => downloadReport("pdf")} className="h-10 rounded-xl border border-[#e0d8cb] px-3 text-[10px] font-bold"><Icon name="file-pdf" className="mr-2 text-[#d95636]" />PDF</button><button onClick={() => downloadReport("excel")} className="h-10 rounded-xl bg-[#2f5d50] px-3 text-[10px] font-bold text-white"><Icon name="file-excel" className="mr-2" />Excel</button></div>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-[10px]"><thead className="bg-[#faf7f1] text-[8px] uppercase text-[#858d88]"><tr><th className="p-3">Producto</th><th>Cantidad</th><th>Ventas</th><th>Costo</th><th>Contribución</th><th>Margen</th></tr></thead><tbody>{dashboard.topItems.map((item) => <tr key={item.name} className="border-t border-[#f0ebe3]"><td className="p-3 font-bold">{item.name}</td><td>{item.quantity}</td><td>{currency.format(item.revenue)}</td><td>{currency.format(item.cost)}</td><td className="font-bold text-[#47733c]">{currency.format(item.contribution)}</td><td>{item.revenue ? Math.round(item.contribution / item.revenue * 100) : 0}%</td></tr>)}</tbody></table></div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_.75fr]">
          <article className="overflow-hidden rounded-[24px] border border-[#e9e2d7] bg-white">
            <div className="flex items-center justify-between border-b border-[#eee7dd] p-5"><div><span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#9a4965]">Egresos</span><h2 className="mt-1 text-base font-extrabold">Gastos registrados</h2></div><button onClick={() => setExpenseOpen((open) => !open)} className="h-10 rounded-xl bg-[#e45c3a] px-3 text-[10px] font-extrabold text-white"><Icon name="plus" className="mr-2" />Registrar</button></div>
            {expenseOpen && <form onSubmit={saveExpense} className="grid gap-2 border-b border-[#eee7dd] bg-[#fff9ef] p-4 sm:grid-cols-2"><input className={fieldClass} type="date" value={expense.date} onChange={(event) => setExpense({ ...expense, date: event.target.value })} required /><input className={fieldClass} placeholder="Categoría" value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value })} required /><input className={`${fieldClass} sm:col-span-2`} placeholder="Descripción" value={expense.description} onChange={(event) => setExpense({ ...expense, description: event.target.value })} required /><input className={fieldClass} type="number" min="1" placeholder="Monto CLP" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} required /><select className={fieldClass} value={expense.type} onChange={(event) => setExpense({ ...expense, type: event.target.value })}><option value="FIXED">Gasto fijo</option><option value="VARIABLE">Gasto variable</option></select><button className="h-11 rounded-xl bg-[#2f5d50] text-xs font-bold text-white sm:col-span-2">Guardar gasto</button></form>}
            <div className="max-h-72 overflow-auto">{dashboard.expenses.map((row) => <div key={row.id} className="grid grid-cols-[80px_1fr_auto] gap-3 border-b border-[#f0ebe3] p-3 text-[10px]"><span className="text-[#8b928e]">{row.date}</span><span><strong className="block">{row.description}</strong><small>{row.category} · {row.type === "FIXED" ? "Fijo" : "Variable"}</small></span><strong>{currency.format(row.amount)}</strong></div>)}</div>
          </article>
          <article className="rounded-[24px] border border-[#e9e2d7] bg-white p-5">
            <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#d95636]">Capital de trabajo</span><h2 className="mt-1 text-base font-extrabold">Inventario y alertas</h2>
            <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#edf5eb] p-3"><span className="text-[8px] uppercase">Inventario valorizado</span><strong className="mt-1 block text-lg text-[#2f5d50]">{currency.format(metrics.inventoryValue)}</strong></div><div className="rounded-xl bg-[#fff0df] p-3"><span className="text-[8px] uppercase">Mermas</span><strong className="mt-1 block text-lg text-[#d95636]">{currency.format(metrics.wasteCost)}</strong></div></div>
            <div className="mt-4 space-y-2">{dashboard.stockRisks.slice(0, 6).map((risk) => <div key={risk.productId} className="flex gap-3 rounded-xl border border-[#eee4d7] p-3"><Icon name="triangle-exclamation" className="text-[#e3a52d]" /><span><strong className="block text-[10px]">{risk.name}</strong><small className="text-[9px] text-[#8a928d]">{risk.stock} disponibles · mínimo {risk.threshold}</small></span></div>)}</div>
          </article>
        </section>
      </>}
    </div>
  );
}

function FinanceMetric({ icon, label, value, helper, change, tone }: { icon: string; label: string; value: string; helper?: string; change?: number; tone: "orange" | "blue" | "yellow" | "red" | "green" | "purple" }) {
  const tones = {
    orange: "bg-[#fff0e8] text-[#d95636]", blue: "bg-[#e8f3f5] text-[#39798b]",
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

/** Coordina sesión, navegación y carga de datos compartidos de la aplicación. */
export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null | undefined>(undefined);
  const [view, setView] = useState<View>("inventory");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState<InventoryStatusFilter>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    apiClient.get<AuthUser>("/auth/me")
      .then(({ data }) => setAuthUser(data))
      .catch(() => setAuthUser(null));
    const unauthorized = () => setAuthUser(null);
    window.addEventListener("buenplato:unauthorized", unauthorized);
    return () => window.removeEventListener("buenplato:unauthorized", unauthorized);
  }, []);

  useEffect(() => {
    if (!authUser) return;
    apiClient.get<Category[]>("/categories")
      .then(({ data }) => setCategories(data))
      .catch((requestError) => setError(apiErrorMessage(requestError)));
  }, [authUser]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ size: "100" });
    if (search.trim()) params.set("search", search.trim());
    if (selectedCategory) params.set("category", selectedCategory);
    return params.toString();
  }, [search, selectedCategory]);

  const loadProducts = useCallback(() => {
    if (!authUser) {
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      apiClient.get<ProductPage>(`/products?${query}`)
        .then(({ data }) => setProducts(data.content))
        .catch((requestError) => {
          setProducts([]);
          setError(apiErrorMessage(requestError));
        })
        .finally(() => setLoading(false));
    }, 160);
    return () => window.clearTimeout(timer);
  }, [authUser, query, refreshKey]);

  useEffect(loadProducts, [loadProducts]);

  function productCreated(product: Product) {
    setSuccess(`${product.name} fue agregado correctamente al inventario.`);
    setRefreshKey((value) => value + 1);
    setView("inventory");
    window.setTimeout(() => setSuccess(""), 5000);
  }

  function inventoryChanged(message: string) {
    setSuccess(message);
    setRefreshKey((value) => value + 1);
    window.setTimeout(() => setSuccess(""), 5000);
  }

  function navigate(nextView: View) {
    setError("");
    setSuccess("");
    setView(nextView);
  }

  async function logout() {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      setAuthUser(null);
      setProducts([]);
      setCategories([]);
    }
  }

  if (authUser === undefined) {
    return <div className="grid min-h-screen place-items-center bg-[#fff8ed]"><BrandedLoader label="Comprobando sesión" /></div>;
  }

  if (authUser === null) {
    return <LoginView onAuthenticated={(user) => {
      setAuthUser(user);
      setView("sales");
    }} />;
  }

  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 240, damping: 27 }}>
      <AppShell view={view} onNavigate={navigate} user={authUser} onLogout={logout}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {view === "sales" ? (
              <SalesView />
            ) : view === "finance" ? (
              <FinanceView />
            ) : view === "inventory" ? (
              <InventoryView
                products={products}
                categories={categories}
                loading={loading}
                error={error}
                success={success}
                search={search}
                selectedCategory={selectedCategory}
                statusFilter={statusFilter}
                onSearch={setSearch}
                onCategory={setSelectedCategory}
                onStatus={setStatusFilter}
                onNewProduct={() => navigate("new-product")}
                onChanged={inventoryChanged}
              />
            ) : (
              <NewProductView categories={categories} onCancel={() => navigate("inventory")} onCreated={productCreated} />
            )}
          </motion.div>
        </AnimatePresence>
      </AppShell>
    </MotionConfig>
  );
}
