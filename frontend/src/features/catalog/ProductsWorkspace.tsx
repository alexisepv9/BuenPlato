/** Pestañas dentro de Productos: evita añadir más entradas al menú lateral. */
import { useState, type ReactNode } from "react";
import type { Category } from "../../types/domain";
import { PromotionManager } from "./PromotionManager";

export function ProductsWorkspace({ enabled, categories, children }: { enabled: boolean; categories: Category[]; children: ReactNode }) {
  const [tab,setTab]=useState("products");
  if (!enabled) return <>{children}</>;
  return <div><nav aria-label="Administración de productos" className="mb-5 flex flex-wrap gap-2">{[["products","Productos"],["offers","Colaciones y promociones"]].map(([key,label])=><button key={key} aria-pressed={tab===key} onClick={()=>setTab(key)} className={`min-h-12 rounded-xl px-4 text-sm font-bold ${tab===key ? "bg-[var(--brand-primary)] text-white" : "border border-[var(--brand-border)] bg-white"}`}>{label}</button>)}</nav>{tab==="products" ? children : <PromotionManager categories={categories} />}</div>;
}
