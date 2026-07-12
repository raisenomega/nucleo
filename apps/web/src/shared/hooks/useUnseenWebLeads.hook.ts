import { useCallback, useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

// Cuenta leads web no-vistos (viewed_at null + lead_source web-landing) para el badge del sidebar.
// RLS scopea por tenant. Refetch cuando cambia `dep` (p.ej. pathname).
export function useUnseenWebLeads(dep?: string) {
  const [count, setCount] = useState(0);
  const load = useCallback(async () => {
    const { count: c } = await supabase.from("leads").select("id", { count: "exact", head: true })
      .is("viewed_at", null).eq("lead_source", "web-landing");
    setCount(c ?? 0);
  }, []);
  useEffect(() => { void load(); }, [load, dep]);
  // El detalle del lead es modal (no cambia pathname); refrescar cuando se marca uno como visto.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = () => void load();
    window.addEventListener("leads-badge-refresh", h);
    return () => window.removeEventListener("leads-badge-refresh", h);
  }, [load]);
  return { count, refresh: load };
}
