/** Formularios y componentes del catálogo de productos vendibles. */
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { apiClient, apiErrorMessage } from "../../lib/api";
import type { Category, InventoryStatusFilter, Product } from "../../types/domain";
import { currency, fieldClass } from "../../lib/presentation";
import { Icon, FloatingAlert, BrandedLoader, PageHeader, StatusPill, MetricCard, FormSection, Field } from "../../components/ui";

/** Consulta, filtra y administra los productos que forman el inventario heredado. */
export function InventoryView({
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
      <FloatingAlert message={success} tone="success" />

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
        <div className="border-b border-[var(--brand-border)] p-4 md:flex md:items-center md:justify-between md:gap-4">
          <div className="relative flex-1 md:max-w-md">
            <Icon name="magnifying-glass" className="absolute top-1/2 left-3.5 -translate-y-1/2 text-xs text-[#8a948e]" />
            <input
              className="h-10 w-full rounded-xl border border-[var(--brand-border)] bg-[#fafaf8] pr-3 pl-9 text-xs outline-none transition placeholder:text-[#9ba39f] focus:border-[#6d8678] focus:bg-white focus:ring-4 focus:ring-[var(--brand-secondary)]/8"
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
          <><FloatingAlert message={error} /><div className="grid min-h-48 place-items-center text-xs text-[var(--brand-muted)]">No fue posible cargar el inventario.</div></>
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

        <footer className="flex items-center justify-between border-t border-[var(--brand-border)] bg-[#fafaf8] px-4 py-3 text-[10px] text-[#7a857f]">
          <span>Mostrando {visibleProducts.length} productos</span>
          <span>Actualizado ahora</span>
        </footer>
      </section>

      <button
        className="fixed right-5 bottom-24 grid size-14 place-items-center rounded-2xl bg-[var(--brand-primary)] text-white shadow-xl lg:hidden"
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

export function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      className={`h-8 shrink-0 rounded-lg px-3 text-[10px] font-bold transition ${
        active ? "bg-[var(--brand-secondary)] text-white" : "bg-[#f4eee4] text-[#69756e] hover:bg-[#fff0d5] hover:text-[#ad4c32]"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ProductAvatar({ product }: { product: Product }) {
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

export function ProductRow({
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

export function ProductMobile({
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
            <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#e7f1e4] text-[10px] font-bold text-[var(--brand-secondary)]" onClick={() => onEdit(product)}>
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
export function EditProductDialog({
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
            <span className="text-[9px] font-extrabold uppercase tracking-[.15em] text-[var(--brand-primary)]">Inventario</span>
            <h2 id="edit-product-title" className="mt-0.5 text-lg font-extrabold text-[var(--brand-secondary)]">Editar producto</h2>
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
          <label className="flex items-center gap-3 rounded-xl border border-[var(--brand-border)] bg-white p-4 sm:col-span-2">
            <input className="size-4 accent-[var(--brand-secondary)]" type="checkbox" name="trackStock" defaultChecked={product.trackStock} />
            <span>
              <strong className="block text-[11px]">Controlar existencias</strong>
              <small className="text-[10px] text-[var(--brand-muted)]">Activa alertas y descuenta stock en las ventas.</small>
            </span>
          </label>
          {message && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 sm:col-span-2">{message}</div>}
        </div>

        <footer className="sticky bottom-0 flex gap-2 border-t border-[#e2ded3] bg-white p-4 sm:justify-end">
          <button type="button" className="h-11 flex-1 rounded-xl border border-[#d8d9d4] px-5 text-xs font-bold text-[var(--brand-muted)] sm:flex-none" onClick={onClose}>Cancelar</button>
          <button type="submit" disabled={saving} className="h-11 flex-1 rounded-xl bg-[var(--brand-primary)] px-5 text-xs font-bold text-white disabled:opacity-60 sm:flex-none">
            <Icon name={saving ? "spinner" : "floppy-disk"} className={`mr-2 ${saving ? "animate-spin" : ""}`} />
            {saving ? "Guardando" : "Guardar cambios"}
          </button>
        </footer>
      </form>
    </div>
  );
}

/** Solicita confirmación antes de desactivar un producto del catálogo. */
export function DeleteProductDialog({
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
        <h2 id="delete-product-title" className="mt-5 text-xl font-extrabold text-[var(--brand-ink)]">Eliminar producto</h2>
        <p className="mt-2 text-xs leading-5 text-[#727d76]">
          <strong>{product.name}</strong> dejará de aparecer en inventario y ventas. Su historial permanecerá protegido.
        </p>
        {message && <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{message}</div>}
        <div className="mt-6 flex gap-2">
          <button className="h-11 flex-1 rounded-xl border border-[#d8d9d4] text-xs font-bold text-[var(--brand-muted)]" onClick={onClose}>Cancelar</button>
          <button className="h-11 flex-1 rounded-xl bg-[#a8473f] text-xs font-bold text-white disabled:opacity-60" disabled={deleting} onClick={remove}>
            {deleting ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Registra un producto nuevo con categoría, precio y política de stock. */
export function NewProductView({
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
                        ? "border-[var(--brand-secondary)] bg-[#edf2ee] text-[#294334] ring-2 ring-[var(--brand-secondary)]/10"
                        : "border-[var(--brand-border)] bg-white text-[#6b7670] hover:border-[#aeb7b1]"
                    }`}
                  >
                    <Icon name={icons[category.slug] ?? "box"} className={active ? "text-[var(--brand-secondary)]" : "text-[#9aa39e]"} />
                    <span className="text-[11px] font-bold">{category.name}</span>
                    {active && <Icon name="circle-check" className="absolute top-3 right-3 text-[11px] text-[var(--brand-secondary)]" />}
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
              <label className="flex items-center gap-3 rounded-xl border border-[var(--brand-border)] bg-[#fafaf8] p-4 md:col-span-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={trackStock}
                  onClick={() => setTrackStock((value) => !value)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${trackStock ? "bg-[var(--brand-secondary)]" : "bg-[#c8ceca]"}`}
                >
                  <span className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition ${trackStock ? "left-6" : "left-1"}`} />
                </button>
                <span>
                  <strong className="block text-[11px]">Controlar existencias</strong>
                  <small className="mt-0.5 block text-[10px] text-[var(--brand-muted)]">Las ventas descontarán automáticamente este producto.</small>
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

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--brand-border)] pt-5 sm:flex-row sm:justify-end">
            <button className="h-11 rounded-xl border border-[#d2d7d3] bg-white px-5 text-xs font-bold text-[#54635b]" type="button" onClick={onCancel}>
              Cancelar
            </button>
            <button
              className="h-11 rounded-xl bg-[var(--brand-primary)] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#c9472a] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              <Icon name={saving ? "spinner" : "floppy-disk"} className={`mr-2 ${saving ? "animate-spin" : ""}`} />
              {saving ? "Guardando producto" : "Guardar producto"}
            </button>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-white">
            <div className="border-b border-[#e5e8e4] bg-[#fafaf8] px-4 py-3">
              <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#858f89]">Vista previa</span>
            </div>
            <div className="p-4">
              <div className="grid aspect-[4/2.3] place-items-center rounded-xl bg-[#edf0eb] text-[#8b9790]">
                <Icon name="image" className="text-2xl" />
              </div>
              <span className="mt-4 block text-[9px] font-extrabold uppercase tracking-wider text-[var(--brand-primary)]">
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
          <div className="rounded-2xl bg-[var(--brand-secondary)] p-5 text-white">
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
