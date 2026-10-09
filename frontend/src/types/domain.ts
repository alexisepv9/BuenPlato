/** Contratos TypeScript de la API y del estado de interfaz; no incluyen lógica de ejecución. */


export type Category = {
  id: number;
  name: string;
  slug: string;
  categoryType: string;
};

export type StockStatus = "NORMAL" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNTRACKED";

export type InventoryStatusFilter = "" | "LOW_STOCK" | "OUT_OF_STOCK";

export type Product = {
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

export type ProductPage = {
  content: Product[];
  totalElements: number;
};

export type Ingredient = {
  id: number;
  sku: string;
  name: string;
  baseUnit: "G" | "ML" | "UNIT";
  imageUrl?: string | null;
  stock: number;
  lowStockThreshold: number;
  unitCost: number;
  stockStatus: "NORMAL" | "LOW_STOCK" | "OUT_OF_STOCK";
};

export type Recipe = {
  id: number;
  productId: number;
  productName: string;
  yieldQuantity: number;
  costPerPortion: number;
  ingredients: { ingredientId: number; ingredientName: string; quantity: number; baseUnit: string }[];
};

export type SaleOption = {
  id: number;
  productId: number;
  name: string;
  description: string;
  price: number;
  extraPrice: number;
  stock: number;
};

export type SaleSection = {
  id: number;
  label: string;
  categorySlug: string;
  minimumSelections: number;
  maximumSelections: number;
  required: boolean;
  options: SaleOption[];
};

export type SaleMenu = {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  sections: SaleSection[];
};

export type SaleProduct = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  categorySlug: string;
  stock: number;
};

export type SalesCatalog = {
  menus: SaleMenu[];
  additionalProducts: SaleProduct[];
};

export type MenuCartLine = {
  key: string;
  menu: SaleMenu;
  selections: Record<number, Record<number, number>>;
  quantity: number;
  totalPrice: number;
};

export type CreatedOrder = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  total: number;
  createdAt: string;
};

export type OrderHistory = {
  revision: number;
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
  items: { menuId: number | null; productId: number | null; itemType: string; itemName: string; quantity: number; unitPrice: number; totalPrice: number;
    selections: { sectionId: number; optionId: number; productId: number; section: string; name: string; quantity: number; totalQuantity: number; extraPrice: number; extraUnitsPerMenu: number }[] }[];
};

export type AuthUser = {
  id: number;
  email: string;
  displayName: string;
  role: string;
};

export type FinanceDashboard = {
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

export type View = "sales" | "inventory" | "finance" | "new-product" | "settings";
