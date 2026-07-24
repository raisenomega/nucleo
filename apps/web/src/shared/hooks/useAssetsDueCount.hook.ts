import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// Badge sidebar: count de planes de mantenimiento vencidos/próximos (2.7b, get_maintenance_status). Se oculta en /assets.
export function useAssetsDueCount(pathname: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (pathname === "/assets") { setCount(0); return; }
    let on = true;
    void supabase.rpc("get_maintenance_status", { _asset_id: null }).then(({ data }) => {
      if (!on) return;
      const rows = (data as { status: string }[] | null) ?? [];
      setCount(rows.filter((r) => r.status === "overdue" || r.status === "due_soon").length);
    });
    return () => { on = false; };
  }, [pathname]);
  return { count };
}
