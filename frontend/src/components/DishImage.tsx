/** Foto ilustrativa servida por el backend desde almacenamiento local. */
import { useEffect, useState } from "react";
import { Icon } from "./ui";

/** Si la imagen falla, conserva el espacio y permite seguir usando el punto de venta. */
export function DishImage({ name, source, productId, menuId, square = false }: { name: string; source: string; productId?: number; menuId?: number; square?: boolean }) {
  const [customFailed, setCustomFailed] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setCustomFailed(false); setFailed(false); }, [productId, menuId, source]);
  const custom = Boolean((productId || menuId) && !customFailed);
  return <div className={`relative mb-3 ${square ? "aspect-square" : "h-32"} overflow-hidden rounded-xl bg-[#f6eadf]`}>
    {failed ? <div className="grid h-full place-items-center"><Icon name="utensils" /></div>
      : <img src={custom ? `/api/${menuId ? "menus" : "products"}/${menuId ?? productId}/photo` : source} alt={name} loading="lazy" onError={() => custom ? setCustomFailed(true) : setFailed(true)} className="h-full w-full object-cover" />}
    {!custom && <span className="absolute bottom-1 right-1 rounded bg-white/90 px-2 text-[9px]">Foto de ejemplo</span>}
  </div>;
}
