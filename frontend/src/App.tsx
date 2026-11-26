/** Coordina sesión, navegación y datos compartidos. Cada módulo implementa su propia interfaz. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { apiClient, apiErrorMessage } from "./lib/api";
import type { Category, InventoryStatusFilter, Product, ProductPage, Ingredient, AuthUser, View } from "./types/domain";
import { BrandedLoader } from "./components/ui";
import { LoginView } from "./features/auth/LoginView";
import { AppShell } from "./components/AppShell";
import { RawInventoryView } from "./features/inventory/RawInventoryView";
import { ProductsWorkspace } from "./features/catalog/ProductsWorkspace";
import { ProductFormDialog } from "./features/catalog/ProductFormDialog";
import { SalesView } from "./features/sales/SalesView";
import { FinanceView } from "./features/finance/FinanceView";
import { SettingsView } from "./features/settings/SettingsView";
import { useBrand } from "./features/settings/BrandProvider";

/** Coordina sesión, navegación y carga de datos compartidos de la aplicación. */
export default function App() {
  const { ready: brandReady } = useBrand();
  const [authUser, setAuthUser] = useState<AuthUser | null | undefined>(undefined);
  const [sessionNotice, setSessionNotice] = useState("");
  const [view, setView] = useState<View>("ingredients");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
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
    const unauthorized = () => {
      setSessionNotice("Tu sesión venció. Vuelve a iniciar sesión para continuar.");
      setAuthUser(null);
    };
    window.addEventListener("buenplato:unauthorized", unauthorized);
    return () => window.removeEventListener("buenplato:unauthorized", unauthorized);
  }, []);

  useEffect(() => {
    if (!authUser) return;
    apiClient.get<Category[]>("/categories")
      .then(({ data }) => setCategories(data))
      .catch((requestError) => setError(apiErrorMessage(requestError)));
  }, [authUser]);

  useEffect(() => {
    if (authUser && authUser.role !== "ADMIN" && view !== "sales") setView("sales");
  }, [authUser, view]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ size: "100" });
    if (selectedCategory) params.set("category", selectedCategory);
    return params.toString();
  }, [selectedCategory]);

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

  const loadIngredients = useCallback(() => {
    if (!authUser || authUser.role !== "ADMIN") return;
    setLoading(true);
    // Las recetas necesitan todos los insumos, sin heredar el buscador de bodega.
    apiClient.get<Ingredient[]>("/ingredients")
      .then(({ data }) => setIngredients(data))
      .catch((requestError) => setError(apiErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [authUser, refreshKey]);

  useEffect(loadIngredients, [loadIngredients]);

  function inventoryChanged(message: string, refresh = true) {
    setSuccess(message);
    if (refresh) setRefreshKey((value) => value + 1);
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

  if (authUser === undefined || !brandReady) {
    return <div className="grid min-h-screen place-items-center bg-[var(--brand-background)]"><BrandedLoader label="Comprobando sesión" /></div>;
  }

  if (authUser === null) {
    return <LoginView notice={sessionNotice} onAuthenticated={(user) => {
      setSessionNotice("");
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
            {view === "settings" && authUser.role === "ADMIN" ? <SettingsView /> : view === "sales" ? (
              <SalesView />
            ) : view === "finance" ? (
              <FinanceView />
            ) : view === "ingredients" || view === "products" ? (
              <ProductsWorkspace key={view} enabled={view === "products" && authUser.role === "ADMIN"} categories={categories}><RawInventoryView
                key={view}
                section={view === "ingredients" ? "ingredients" : "recipes"}
                ingredients={ingredients}
                products={products}
                categories={categories}
                loading={loading}
                error={error}
                success={success}
                search={search}
                statusFilter={statusFilter}
                onSearch={setSearch}
                onStatus={setStatusFilter}
                onChanged={inventoryChanged}
              /></ProductsWorkspace>
            ) : (
              <ProductFormDialog product={null} categories={categories} ingredients={ingredients} onClose={() => navigate("products")} onSaved={() => { navigate("products"); inventoryChanged("Producto guardado correctamente."); }} />
            )}
          </motion.div>
        </AnimatePresence>
      </AppShell>
    </MotionConfig>
  );
}
