import { useCallback, useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// Cuenta órdenes que requieren acción de Roy (pending/awaiting_payment/awaiting_confirmation) para el badge del sidebar.
// awaiting_confirmation = cliente confirmó pago ATH y espera verificación — es el estado que MÁS necesita atención. RLS scopea por tenant.
export function useOrdersUnseenCount(dep?: string) {
  const [count, setCount] = useState(0);
  const load = useCallback(async () => {
    const { count: c } = await supabase.from("tenant_landing_orders").select("id", { count: "exact", head: true })
      .in("status", ["pending", "awaiting_payment", "awaiting_confirmation"]);
    setCount(c ?? 0);
  }, []);
  useEffect(() => { void load(); }, [load, dep]);
  return { count, refresh: load };
}
