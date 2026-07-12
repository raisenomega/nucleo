import { useCallback, useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// Cuenta citas próximas 24h (agendada/confirmada) para el badge del sidebar. RLS scopea por tenant.
export function useUpcomingAppointments(dep?: string) {
  const [count, setCount] = useState(0);
  const load = useCallback(async () => {
    const now = new Date(); const in24 = new Date(now.getTime() + 24 * 3600 * 1000);
    const { count: c } = await supabase.from("appointments").select("id", { count: "exact", head: true })
      .in("status", ["agendada", "confirmada"]).gte("starts_at", now.toISOString()).lte("starts_at", in24.toISOString());
    setCount(c ?? 0);
  }, []);
  useEffect(() => { void load(); }, [load, dep]);
  return { count, refresh: load };
}
