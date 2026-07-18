import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// Badge sidebar: count de activos con mantenimiento vencido (max next_due < hoy). Se oculta en /assets.
export function useAssetsDueCount(pathname: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (pathname === "/assets") { setCount(0); return; }
    let on = true;
    void supabase.from("asset_maintenance_log").select("asset_id, next_due").not("next_due", "is", null).then(({ data }) => {
      if (!on) return;
      const rows = (data as { asset_id: string; next_due: string }[] | null) ?? [];
      const maxByAsset = new Map<string, string>();
      rows.forEach((r) => { const p = maxByAsset.get(r.asset_id); if (!p || r.next_due > p) maxByAsset.set(r.asset_id, r.next_due); });
      const today = new Date().toISOString().slice(0, 10);
      setCount([...maxByAsset.values()].filter((d) => d < today).length);
    });
    return () => { on = false; };
  }, [pathname]);
  return { count };
}
