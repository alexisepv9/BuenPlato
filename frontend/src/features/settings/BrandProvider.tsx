/** Fuente única de identidad: carga pública, sincronización y tokens CSS globales. */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "../../lib/api";

export const palettes = {
  terracotta: { label: "Terracota", primary: "#b9472e", secondary: "#853951", background: "#fff8ef", soft: "#fbece5" },
  ocean: { label: "Océano", primary: "#146a91", secondary: "#465694", background: "#f2f8fc", soft: "#e2f0f8" },
  plum: { label: "Ciruela", primary: "#81439a", secondary: "#a43b64", background: "#faf5fc", soft: "#f1e5f6" },
  forest: { label: "Bosque", primary: "#397348", secondary: "#85632d", background: "#f5f9f2", soft: "#e7f0df" },
} as const;
export type Palette = keyof typeof palettes;
export type Brand = { name: string; palette: Palette; hasLogo: boolean; revision: number };
const initial: Brand = { name: "Buen Plato", palette: "terracotta", hasLogo: false, revision: 0 };
const BrandContext = createContext<{ brand: Brand; ready: boolean; failed: boolean; setBrand: (value: Brand) => void }>({ brand: initial, ready: false, failed: false, setBrand: () => {} });

/** Tokens semánticos: la misma función visual mantiene el mismo color en cada pantalla. */
export function applyPalette(key: Palette) {
  const palette = palettes[key] ?? palettes.terracotta;
  const tokens = { primary: palette.primary, secondary: palette.secondary, background: palette.background, soft: palette.soft,
    border: `color-mix(in srgb, ${palette.primary} 18%, white)`, ink: "#292b30", muted: "#697078" };
  for (const [name, value] of Object.entries(tokens)) document.documentElement.style.setProperty(`--brand-${name}`, value);
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brand, setBrand] = useState(initial);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    // Otras cajas recogen cambios sin cerrar sesión; el foco también fuerza una lectura.
    const refresh = () => apiClient.get<Brand>("/branding").then(({ data }) => {
      if (active) { setBrand(previous => previous.revision === data.revision && previous.name === data.name ? previous : data); setFailed(false); }
    }).catch(() => { if (active) setFailed(true); }).finally(() => { if (active) setReady(true); });
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  useEffect(() => { applyPalette(brand.palette); document.title = brand.name; }, [brand]);
  return <BrandContext.Provider value={{ brand, ready, failed, setBrand }}>{children}</BrandContext.Provider>;
}

export function useBrand() { return useContext(BrandContext); }

/** Logo público guardado en BD, con revisión para invalidar la imagen tras un cambio. */
export function BrandLogo() {
  const { brand } = useBrand();
  return brand.hasLogo ? <img src={`/api/branding/logo?v=${brand.revision}`} alt={`Logo de ${brand.name}`} className="h-full w-full rounded-xl bg-white object-contain p-1" /> : <i className="fa-solid fa-utensils" aria-hidden="true" />;
}
