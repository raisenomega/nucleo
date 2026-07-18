import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// FIX5 — count de items bajo stock para el badge del sidebar. Se oculta (0) mientras se está en /inventory.
export function useLowStockCount(pathname: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (pathname === "/inventory") { setCount(0); return; }
    let on = true;
    void supabase.from("inventory_items").select("stock, min_stock").then(({ data }) => {
      if (!on) return;
      const rows = (data as { stock: number; min_stock: number }[] | null) ?? [];
      setCount(rows.filter((r) => r.min_stock > 0 && r.stock <= r.min_stock).length);
    });
    return () => { on = false; };
  }, [pathname]);
  return { count };
}
