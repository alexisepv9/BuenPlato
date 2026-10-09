/** Construcción del pedido buffet y productos individuales. El servidor confirma precios y descuenta existencias. */
import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { DishImage } from "../../components/DishImage";
import { openOrderPrint } from "./printOrder";
import { apiClient, apiErrorMessage } from "../../lib/api";
import type { SaleOption, SaleSection, SaleProduct, SalesCatalog, MenuCartLine, CreatedOrder, OrderHistory } from "../../types/domain";
import { currency, fieldClass } from "../../lib/presentation";
import { Icon, FloatingAlert, BrandedLoader, PageHeader, Field } from "../../components/ui";

/**
 * Punto de venta buffet.
 * Separa la cantidad de menús de su composición, calcula recargos una sola vez
 * y envía al backend una línea agrupada con sus productos individuales.
 */
export function SalesView() {
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
  const [replacingOrder, setReplacingOrder] = useState<OrderHistory | null>(null);

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

  /** Limpia el pedido en curso y devuelve al selector inicial sin afectar ventas guardadas. */
  function cancelCurrentSale() {
    setReplacingOrder(null);
    loadCatalog();
    setSelectedMenuId(null); setEditingMenuKey(null); setShowIndividualProducts(false);
    setMenuQuantity(1); setSelections({}); setMenuLines([]); setExtras({});
    setCustomerName(""); setNotes(""); setMobileSummaryOpen(false); setError("");
  }

  async function openHistory() {
    setHistoryOpen(true);
    setHistoryLoading(true);
    setError("");
    try {
      const { data } = await apiClient.get<OrderHistory[]>("/orders");
      // Una respuesta incompatible debe mostrar un aviso, nunca romper toda la pantalla.
      if (!Array.isArray(data) || data.some(order => !Array.isArray(order.items)
        || order.items.some(item => item.selections != null && !Array.isArray(item.selections)))) {
        throw new Error("El detalle del historial tiene un formato incompatible. Actualiza el sistema e inténtalo nuevamente.");
      }
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
  // El borrador sustituye la línea editada en la vista previa, sin duplicar su importe.
  const summaryTotal = selectedMenu
    ? total - (menuLines.find(line => line.key === editingMenuKey)?.totalPrice ?? 0) + builderPrice
    : total;
  const summaryVisible = Boolean(selectedMenu || menuLines.length || Object.values(extras).some(quantity => quantity > 0));
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
  const canSubmit = Boolean(menuLines.length || hasExtra) && !selectedMenu && !saving;
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
    setMobileSummaryOpen(true);
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
    if (delta > 0 && available > 0) setMobileSummaryOpen(true);
    setExtras((current) => ({
      ...current,
      [productId]: Math.max(0, Math.min(Math.floor(available), (current[productId] ?? 0) + delta)),
    }));
  }

  /** Carga la venta al editor habitual sin alterar el servidor hasta confirmar. */
  async function editCompleteOrder(order: OrderHistory) {
    if ((menuLines.length || hasExtra || selectedMenu) && !window.confirm("Se reemplazará el borrador actual por esta venta. ¿Continuar?")) return;
    try {
      const { data: current } = await apiClient.get<SalesCatalog>("/sales/catalog");
      const credits: Record<number, number> = {};
      for (const item of order.items) {
        if (item.productId) credits[item.productId] = (credits[item.productId] ?? 0) + item.quantity;
        for (const option of item.selections) credits[option.productId] = (credits[option.productId] ?? 0) + option.totalQuantity;
      }
      // La venta original devolverá este consumo al guardarse; la API valida el stock real.
      current.additionalProducts.forEach(product => { product.stock += credits[product.id] ?? 0; });
      current.menus.forEach(menu => menu.sections.forEach(section => section.options.forEach(option => { option.stock += credits[option.productId] ?? 0; })));
      const lines: MenuCartLine[] = [];
      const products: Record<number, number> = {};
      for (const [index, item] of order.items.entries()) {
        if (item.itemType === "PRODUCT") {
          if (!current.additionalProducts.some(product => product.id === item.productId)) throw new Error(`No se puede editar: ${item.itemName} ya no está disponible.`);
          products[item.productId!] = (products[item.productId!] ?? 0) + item.quantity;
          continue;
        }
        const menu = current.menus.find(entry => entry.id === item.menuId);
        if (!menu) throw new Error(`No se puede editar: ${item.itemName} ya no está disponible.`);
        const composition: MenuCartLine["selections"] = {};
        for (const selection of item.selections) {
          if (!menu.sections.some(section => section.id === selection.sectionId && section.options.some(option => option.id === selection.optionId))) throw new Error(`La opción ${selection.name} ya no está disponible. Solicita revisión al administrador.`);
          composition[selection.sectionId] ??= {};
          composition[selection.sectionId][selection.optionId] = selection.quantity;
        }
        let price = menu.basePrice * item.quantity;
        for (const section of menu.sections) {
          let included = section.maximumSelections;
          for (const option of section.options) {
            const quantity = composition[section.id]?.[option.id] ?? 0;
            const covered = Math.min(included, quantity); included -= covered;
            price += option.extraPrice * quantity + option.price * (quantity - covered);
          }
        }
        lines.push({ key: `history-${order.id}-${index}`, menu, quantity: item.quantity, selections: composition, totalPrice: price });
      }
      setCatalog(current); setMenuLines(lines); setExtras(products); setReplacingOrder(order);
      setCustomerName(order.customerName ?? ""); setServiceType(order.serviceType); setPaymentMethod(order.paymentMethod); setNotes(order.notes ?? "");
      setSelectedMenuId(null); setEditingMenuKey(null); setEditingOrder(null); setShowIndividualProducts(false);
      setHistoryOpen(false); setCreatedOrder(null); setMobileSummaryOpen(true); setError("");
    } catch (failure) { setError(apiErrorMessage(failure)); }
  }

  async function createOrder() {
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    setCreatedOrder(null);
    try {
      const payload = {
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
      };
      const { data } = replacingOrder
        ? await apiClient.put<CreatedOrder>(`/orders/${replacingOrder.id}/content`, { sale: payload, expectedRevision: replacingOrder.revision })
        : await apiClient.post<CreatedOrder>("/orders", payload);
      setReplacingOrder(null);
      window.dispatchEvent(new Event("buenplato:sale-changed"));
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
      <FloatingAlert message={createdOrder ? `Venta registrada · Pedido ${createdOrder.orderNumber} · ${currency.format(createdOrder.total)}` : ""} tone="success" />

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

      <FloatingAlert message={error} />

      {createdOrder && <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--brand-border)] bg-white p-4">
        <strong className="w-full text-sm">Pedido guardado · {createdOrder.orderNumber}</strong>
        <button className="rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-white" onClick={() => void openOrderPrint(createdOrder.id, "customer").catch(failure => setError(apiErrorMessage(failure)))}>Imprimir comprobante cliente</button>
        <button className="rounded-xl border border-[var(--brand-primary)] px-4 py-3 text-sm font-bold text-[#b9472e]" onClick={() => void openOrderPrint(createdOrder.id, "kitchen").catch(failure => setError(apiErrorMessage(failure)))}>Imprimir comanda</button>
      </div>}

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className={selectedMenu ? "fixed inset-0 z-[60] space-y-5 overflow-y-auto bg-[#f7f2ea] p-4 pb-40 sm:p-6 xl:pr-[420px]" : "space-y-5"}>
          <div className={`rounded-[24px] border border-white bg-white/95 p-5 shadow-[0_18px_45px_rgba(47,93,80,.09)] ${selectedMenu ? "hidden" : ""}`}>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[var(--brand-primary)]">01 · Menú</span>
                <h2 className="mt-1 text-lg font-extrabold text-[var(--brand-ink)]">¿Qué deseas agregar?</h2>
              </div>
              <span className="text-[10px] text-[#87918b]">Menú o producto suelto</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {catalog?.menus.map((menu) => {
                const active = selectedMenuId === menu.id;
                return (
                  <button key={menu.id} onClick={() => chooseMenu(menu.id)} className={`rounded-2xl border p-4 text-left transition ${active ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] ring-2 ring-[var(--brand-primary)]/10" : "border-[var(--brand-border)] bg-[var(--brand-background)] hover:border-[#f2b544]"}`}>
                    <DishImage name={menu.name} source="/api/images/demo/food" />
                    <strong className="mt-4 block text-sm">{menu.name}</strong>
                    <span className="mt-1 block text-[10px] leading-4 text-[var(--brand-muted)]">{menu.description}</span>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <strong className="text-sm text-[var(--brand-primary)]">{currency.format(menu.basePrice)}</strong>
                      <span className="rounded-lg bg-[var(--brand-primary)] px-2.5 py-1.5 text-[9px] font-extrabold text-white">
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
                className={`rounded-2xl border p-4 text-left transition ${showIndividualProducts ? "border-[var(--brand-secondary)] bg-[#fbf0f4] ring-2 ring-[var(--brand-secondary)]/10" : "border-[var(--brand-border)] bg-[var(--brand-background)] hover:border-[#f2b544]"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid size-10 place-items-center rounded-xl bg-[var(--brand-secondary)] text-white"><Icon name="basket-shopping" /></div>
                  {showIndividualProducts && <Icon name="circle-check" className="text-[var(--brand-secondary)]" />}
                </div>
                <strong className="mt-4 block text-sm">Producto individual</strong>
                <span className="mt-1 block text-[10px] leading-4 text-[var(--brand-muted)]">Vende proteínas, agregados, ensaladas, postres, bebidas o extras por separado.</span>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <strong className="text-sm text-[var(--brand-secondary)]">{catalog?.additionalProducts.length ?? 0} opciones</strong>
                  <span className="rounded-lg bg-[var(--brand-secondary)] px-2.5 py-1.5 text-[9px] font-extrabold text-white">
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
                        className="rounded-xl border border-[#dfcda9] bg-white px-3 py-2 text-[10px] font-extrabold text-[#765f47] shadow-sm"
                        onClick={() => {
                          setSelectedMenuId(null);
                          setEditingMenuKey(null);
                          setMenuQuantity(1);
                          setSelections({});
                        }}
                      >
                        <Icon name="arrow-left" className="mr-2" />Volver
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
                    <strong className="block text-2xl text-[var(--brand-secondary)] sm:text-xl">{menuQuantity}</strong>
                    <span className="block text-[8px] font-bold uppercase tracking-[.12em] text-[#8a918c]">menús</span>
                  </div>
                  <button
                    className="grid size-12 place-items-center rounded-xl bg-[var(--brand-primary)] text-base text-white shadow-[0_8px_18px_rgba(228,92,58,.25)] active:scale-95 disabled:opacity-30 sm:size-10"
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
                      <article key={option.id} className={`relative min-h-32 rounded-2xl border p-3 transition ${active ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] shadow-[0_10px_25px_rgba(216,93,61,.12)]" : "border-[var(--brand-border)] bg-[#fcfaf7] hover:-translate-y-0.5 hover:border-[#f2b544]"}`}>
                        <DishImage productId={option.productId} name={option.name} source={`/api/images/demo/${section.categorySlug === "postres" ? "fruit" : "food"}`} />
                        <div className="flex items-center justify-end">
                          <div className="flex items-center gap-1.5">
                            <button
                              className="grid size-7 place-items-center rounded-lg bg-white text-[#637068] shadow-sm disabled:opacity-30"
                              disabled={optionQuantity === 0}
                              onClick={() => changeOptionQuantity(section, option, -1)}
                              aria-label={`Quitar ${option.name}`}
                            >
                              <Icon name="minus" />
                            </button>
                            <strong className="w-5 text-center text-xs text-[var(--brand-secondary)]">{optionQuantity}</strong>
                            <button
                              className="grid size-7 place-items-center rounded-lg bg-[var(--brand-secondary)] text-white shadow-sm disabled:opacity-30"
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
                        <span className="mt-2 block text-[10px] font-extrabold text-[var(--brand-primary)]">
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
                className="h-12 rounded-xl bg-[var(--brand-primary)] px-5 text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(216,93,61,.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="cart-plus" className="mr-2" />
                Guardar {menuQuantity === 1 ? "menú" : `${menuQuantity} menús`}
              </button>
            </div>
          )}

          {showIndividualProducts && <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="individual-products-title">
            <button className="absolute inset-0 bg-[#34251d]/35 backdrop-blur-[3px]" onClick={() => setShowIndividualProducts(false)} aria-label="Cerrar productos individuales" />
            <div className="relative flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[30px] border border-white bg-[var(--brand-background)] shadow-[0_-20px_60px_rgba(58,39,26,.22)] sm:rounded-[30px]">
              <div className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-[#ddd2c5] sm:hidden" />
              <div className="flex items-start justify-between gap-4 border-b border-[var(--brand-border)] p-5">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[var(--brand-secondary)]">Venta directa</span>
                  <h2 id="individual-products-title" className="mt-1 text-lg font-extrabold">Productos individuales</h2>
                  <p className="mt-1 text-[10px] text-[#7c8580]">También puedes vender una proteína, agregado, ensalada, postre, bebida o extra sin incluir un menú.</p>
                </div>
                <button className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[#615951]" onClick={() => setShowIndividualProducts(false)} aria-label="Cerrar"><Icon name="xmark" /></button>
              </div>
              <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-[var(--brand-border)] bg-white px-5 py-3 [scrollbar-width:none]">
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
                    <h3 className="mb-2 text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--brand-muted)]">{group.name}</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.products.map((product) => {
                        const quantity = extras[product.id] ?? 0;
                        return (
                          <article key={product.id} className={`flex min-w-0 flex-col rounded-2xl border p-3 transition ${quantity > 0 ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] shadow-sm" : "border-[var(--brand-border)] bg-[#fcfaf7]"}`}>
                            <div className="min-w-0 flex-1">
                              <DishImage productId={product.id} name={product.name} source={`/api/images/demo/${product.categorySlug === "postres" ? "fruit" : "food"}`} />
                              <strong className="block text-sm leading-5">{product.name}</strong>
                              <span className="mt-1 block text-sm font-bold text-[var(--brand-primary)]">{currency.format(product.price)}</span>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--brand-border)] pt-3">
                              <button className="grid size-11 place-items-center rounded-xl bg-white text-[#637068] shadow-sm disabled:opacity-30" disabled={quantity === 0} onClick={() => changeExtra(product.id, -1, product.stock)} aria-label={`Quitar ${product.name}`}><Icon name="minus" /></button>
                              <span className="text-center"><strong className="block text-sm">{quantity}</strong><span className="text-[10px] text-[var(--brand-muted)]">{product.stock < 1 ? "Agotado" : "Cantidad"}</span></span>
                              <button className="grid size-11 place-items-center rounded-xl bg-[var(--brand-primary)] text-white shadow-sm disabled:opacity-30" disabled={quantity >= product.stock} onClick={() => changeExtra(product.id, 1, product.stock)} aria-label={`Agregar ${product.name}`}><Icon name="plus" /></button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--brand-border)] bg-white p-4">
                <button className="h-12 w-full rounded-xl bg-[var(--brand-secondary)] text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(154,73,101,.22)]" onClick={() => setShowIndividualProducts(false)}>
                  <Icon name="check" className="mr-2" />Listo, continuar con el pedido
                </button>
              </div>
            </div>
          </div>}
        </div>

        {historyOpen && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#34251d]/35 backdrop-blur-[3px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="sales-history-title">
            <div className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[30px] bg-[var(--brand-background)] shadow-[0_-20px_70px_rgba(58,39,26,.28)] sm:rounded-[30px]">
              <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-[#ddd2c5] sm:hidden" />
              <header className="flex items-start justify-between gap-4 border-b border-[var(--brand-border)] p-5">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[var(--brand-primary)]">Control de ventas</span>
                  <h2 id="sales-history-title" className="mt-1 text-xl font-extrabold">Historial de ventas</h2>
                  <p className="mt-1 text-[10px] text-[#7c8580]">Últimas 100 ventas registradas en el backend.</p>
                </div>
                <button className="grid size-10 place-items-center rounded-xl bg-[var(--brand-soft)] text-[#615951]" onClick={() => { setHistoryOpen(false); setEditingOrder(null); }} aria-label="Cerrar historial"><Icon name="xmark" /></button>
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
                          <strong className="block text-base text-[var(--brand-primary)]">{currency.format(order.total)}</strong>
                          <button onClick={() => void editCompleteOrder(order)} className="mt-1 text-[10px] font-extrabold text-[#b9472e]"><Icon name="pen" className="mr-1.5" />Modificar pedido completo</button>
                          <button onClick={() => setEditingOrder({ ...order })} className="mt-2 block text-[10px] font-bold">Editar atención y pago</button>
                        </div>
                      </div>
                      <details className="mt-3 rounded-xl bg-[var(--brand-background)] p-3">
                        <summary className="cursor-pointer text-sm font-bold text-[#b9472e]">Ver venta completa</summary>
                        <div className="my-3 flex flex-wrap gap-3">
                          <button className="rounded-lg border p-2 text-xs" onClick={() => void openOrderPrint(order.id, "customer", true).catch(failure => setError(apiErrorMessage(failure)))}>Reimprimir comprobante</button>
                          <button className="rounded-lg border p-2 text-xs" onClick={() => void openOrderPrint(order.id, "kitchen", true).catch(failure => setError(apiErrorMessage(failure)))}>Reimprimir comanda</button>
                        </div>
                        <p className="my-3 text-xs">{order.serviceType === "TAKEAWAY" ? "Para llevar" : "Consumir aquí"} · {({ CASH: "Efectivo", CARD: "Tarjeta", TRANSFER: "Transferencia" } as Record<string, string>)[order.paymentMethod] ?? order.paymentMethod} · {order.paymentStatus}</p>
                        {order.items.map((item, index) => <div key={index} className="border-t border-[var(--brand-border)] py-3 text-xs">
                          <div className="flex justify-between gap-3 font-bold"><span>{item.quantity} × {item.itemName}</span><span>{currency.format(item.totalPrice)}</span></div>
                          <p className="mt-1 text-gray-500">Base: {currency.format(item.unitPrice)} / unidad</p>
                          {item.selections?.map((selection, detailIndex) => <p key={detailIndex} className="mt-2 pl-3">{selection.totalQuantity} × {selection.name}{selection.extraPrice > 0 ? ` · Recargo ${currency.format(selection.extraPrice * selection.quantity)}` : ""}</p>)}
                        </div>)}
                        <p className="border-t border-[var(--brand-border)] pt-3 font-bold">Total cobrado: {currency.format(order.total)}</p>
                        <p className="mt-2 whitespace-pre-wrap">Notas: {order.notes || "Sin notas"}</p>
                      </details>
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
                <div><span className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[var(--brand-primary)]">Editar venta</span><h2 id="edit-sale-title" className="mt-1 text-lg font-extrabold">{editingOrder.orderNumber}</h2></div>
                <button className="grid size-9 place-items-center rounded-xl bg-[var(--brand-soft)]" onClick={() => setEditingOrder(null)}><Icon name="xmark" /></button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Field label="Cliente" className="sm:col-span-2"><input className={fieldClass} value={editingOrder.customerName ?? ""} onChange={(event) => setEditingOrder({ ...editingOrder, customerName: event.target.value })} /></Field>
                <Field label="Servicio"><select className={fieldClass} value={editingOrder.serviceType} onChange={(event) => setEditingOrder({ ...editingOrder, serviceType: event.target.value })}><option value="TAKEAWAY">Para llevar</option><option value="DINE_IN">Consumir aquí</option></select></Field>
                <Field label="Medio de pago"><select className={fieldClass} value={editingOrder.paymentMethod} onChange={(event) => setEditingOrder({ ...editingOrder, paymentMethod: event.target.value })}><option value="CASH">Efectivo</option><option value="CARD">Tarjeta</option><option value="TRANSFER">Transferencia</option></select></Field>
                <Field label="Estado" className="sm:col-span-2"><select className={fieldClass} value={editingOrder.status} onChange={(event) => setEditingOrder({ ...editingOrder, status: event.target.value })}><option value="PAID">Pagado</option><option value="PREPARING">En preparación</option><option value="COMPLETED">Completado</option></select></Field>
                <Field label="Notas" className="sm:col-span-2"><textarea className={`${fieldClass} min-h-24 py-3`} value={editingOrder.notes ?? ""} onChange={(event) => setEditingOrder({ ...editingOrder, notes: event.target.value })} /></Field>
              </div>
              <button disabled={saving} onClick={saveOrderChanges} className="mt-5 h-12 w-full rounded-xl bg-[var(--brand-secondary)] text-xs font-extrabold text-white disabled:opacity-50"><Icon name={saving ? "spinner" : "check"} className={`mr-2 ${saving ? "animate-spin" : ""}`} />Guardar cambios</button>
            </div>
          </div>
        )}

        {mobileSummaryOpen && summaryVisible && !showIndividualProducts && (
          <button
            className="fixed inset-x-0 top-0 z-[61] bg-[#34251d]/35 backdrop-blur-[3px] xl:hidden"
            style={{ bottom: "calc(88px + env(safe-area-inset-bottom, 0px))" }}
            onClick={() => setMobileSummaryOpen(false)}
            aria-label="Cerrar resumen del pedido"
          />
        )}
        {!mobileSummaryOpen && summaryVisible && !showIndividualProducts && (
          <button
            className="fixed right-4 z-[62] flex items-center gap-3 rounded-2xl bg-[var(--brand-primary)] px-4 py-3 text-left text-white shadow-[0_14px_35px_rgba(142,45,25,.30)] xl:hidden"
            style={{ bottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
            onClick={() => setMobileSummaryOpen(true)}
          >
            <span className="grid size-9 place-items-center rounded-xl bg-white/15"><Icon name="basket-shopping" /></span>
            <span>
              <span className="block text-[9px] font-bold uppercase tracking-[.12em] text-white/75">Ver pedido</span>
              <strong className="block text-sm">{currency.format(summaryTotal)}</strong>
            </span>
            <span className="grid size-7 place-items-center rounded-lg bg-white text-[var(--brand-primary)]"><Icon name="chevron-up" /></span>
          </button>
        )}
        {summaryVisible && !showIndividualProducts && <aside style={{ bottom: "calc(88px + env(safe-area-inset-bottom, 0px))" }} className={`fixed inset-x-0 z-[62] transform transition-transform duration-300 ${selectedMenu ? "xl:fixed xl:left-auto xl:right-6 xl:top-6 xl:w-[370px] xl:overflow-y-auto" : "xl:sticky xl:inset-auto xl:top-24 xl:z-auto xl:self-start"} xl:translate-y-0 ${mobileSummaryOpen ? "translate-y-0" : "pointer-events-none translate-y-full xl:pointer-events-auto"}`}>
          <div className="flex max-h-[calc(100dvh-176px)] flex-col overflow-hidden rounded-t-[30px] border border-[var(--brand-border)] bg-[#fffdf8] text-[var(--brand-ink)] shadow-[0_-20px_60px_rgba(79,55,30,.25)] xl:max-h-none xl:rounded-[26px] xl:shadow-[0_20px_55px_rgba(79,55,30,.20)]">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-[#ddd2c5] xl:hidden" />
            <button
              className="flex w-full items-center justify-between border-b border-[#eee2d1] p-4 text-left xl:cursor-default xl:p-5"
              onClick={() => setMobileSummaryOpen(false)}
            >
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[var(--brand-primary)]">{replacingOrder ? `Editando ${replacingOrder.orderNumber}` : "Resumen del pedido"}</span>
                <h2 className="mt-1 text-xl font-extrabold" aria-live="polite">Total {currency.format(summaryTotal)}</h2>
              </div>
              <div className="flex items-center gap-3 xl:hidden">
                <span className="rounded-full bg-[#fff0d5] px-2.5 py-1 text-[9px] font-extrabold text-[#9b6018]">
                  {menuLines.length + Object.values(extras).filter((quantity) => quantity > 0).length} ítems
                </span>
                <span className="grid size-9 place-items-center rounded-xl bg-[var(--brand-primary)] text-white">
                  <Icon name="xmark" />
                </span>
              </div>
            </button>
            <div className="min-h-0 overflow-y-auto xl:overflow-visible">
              <div className="max-h-64 space-y-3 overflow-y-auto p-5 text-[11px]">
                {selectedMenu && <div className="rounded-xl border border-[#eee2d2] bg-[var(--brand-background)] p-3">
                  <strong>{menuQuantity} × {selectedMenu.name} · {currency.format(builderPrice)}</strong>
                  <p className="mt-1 text-[#b9472e]">En configuración · agrega el menú antes de confirmar la venta.</p>
                  {selectedMenu.sections.flatMap(section => section.options.filter(option => (selections[section.id]?.[option.id] ?? 0) > 0).map(option => <p key={option.id} className="mt-1">{selections[section.id][option.id]} × {option.name}</p>))}
                </div>}
                {menuLines.filter(line => !selectedMenu || line.key !== editingMenuKey).map((line) => (
                  <div key={line.key} className="rounded-xl border border-[#eee2d2] bg-[var(--brand-background)] p-3">
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
                {!selectedMenu && !menuLines.length && !hasExtra && <p className="text-[#929992]">Configura un menú o agrega productos para comenzar.</p>}
              </div>
              <div className="space-y-3 border-t border-[#eee2d1] bg-[var(--brand-background)] p-5">
              {replacingOrder && <p className="rounded-xl bg-[#fff0cf] p-3 text-xs">Modificas una venta existente, no creas otra. Se aplican precios y recetas actuales. Total anterior: {currency.format(replacingOrder.total)}. Cancelar descarta los cambios.</p>}
              <input className="h-11 w-full rounded-xl border border-[#e5d8c6] bg-white px-3 text-xs text-[var(--brand-ink)] outline-none placeholder:text-[#a29f98] focus:border-[var(--brand-primary)]" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nombre del cliente (opcional)" />
                <div className="grid grid-cols-2 gap-2">
                  <select className="h-11 rounded-xl border border-[#e5d8c6] bg-white px-3 text-xs text-[var(--brand-ink)] outline-none" value={serviceType} onChange={(event) => setServiceType(event.target.value)}>
                    <option value="TAKEAWAY">Para llevar</option>
                    <option value="DINE_IN">Consumir aquí</option>
                  </select>
                  <select className="h-11 rounded-xl border border-[#e5d8c6] bg-white px-3 text-xs text-[var(--brand-ink)] outline-none" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                    <option value="CASH">Efectivo</option>
                    <option value="CARD">Tarjeta</option>
                    <option value="TRANSFER">Transferencia</option>
                  </select>
                </div>
                <textarea className="min-h-20 w-full rounded-xl border border-[#e5d8c6] bg-white p-3 text-xs text-[var(--brand-ink)] outline-none placeholder:text-[#a29f98] focus:border-[var(--brand-primary)]" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas para cocina" maxLength={500} />
                {selectedMenu && !menuIsComplete && <p className="rounded-xl bg-[#fff0cf] p-3 text-[10px] leading-4 text-[#8b5b12]">Completa las cantidades obligatorias del menú antes de guardarlo.</p>}
                <button disabled={!canSubmit} onClick={createOrder} className="h-12 w-full rounded-xl bg-[var(--brand-primary)] text-xs font-extrabold text-white shadow-[0_10px_25px_rgba(142,45,25,.25)] transition hover:bg-[#ef6a48] disabled:cursor-not-allowed disabled:opacity-40">
                  <Icon name={saving ? "spinner" : "check"} className={`mr-2 ${saving ? "animate-spin" : ""}`} />
                {saving ? "Guardando venta" : `${replacingOrder ? "Guardar cambios" : "Confirmar"} · ${currency.format(total)}`}
                </button>
                {(menuLines.length > 0 || hasExtra || selectedMenu) && <button type="button" onClick={cancelCurrentSale} className="h-11 w-full rounded-xl border border-[#e7cfc7] bg-white text-xs font-extrabold text-[#b9472e]"><Icon name="xmark" className="mr-2" />Cancelar pedido y volver</button>}
              </div>
            </div>
          </div>
        </aside>}
      </section>
    </div>
  );
}
