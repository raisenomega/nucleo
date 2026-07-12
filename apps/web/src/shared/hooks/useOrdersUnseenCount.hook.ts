import { useCallback, useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// Cuenta órdenes web sin cobrar (pending/awaiting_payment) para el badge del sidebar. RLS scopea por tenant.
export function useOrdersUnseenCount(dep?: string) {
  const [count, setCount] = useState(0);
  const load = useCallback(async () => {
    const { count: c } = await supabase.from("tenant_landing_orders").select("id", { count: "exact", head: true })
      .in("status", ["pending", "awaiting_payment"]);
    setCount(c ?? 0);
  }, []);
  useEffect(() => { void load(); }, [load, dep]);
  return { count, refresh: load };
}
