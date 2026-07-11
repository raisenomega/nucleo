import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

const cache = new Map<string, Record<string, unknown> | null>();

// Fetch _public_get_landing_home por hostname (client-side). Cache en memoria por host. null si no aplica.
export function useLandingHome(): Record<string, unknown> | null {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    if (cache.has(host)) { setData(cache.get(host) ?? null); return; }
    void supabase.rpc("_public_get_landing_home", { _hostname: host }).then(({ data: d }) => {
      const v = d && !(d as { status?: string }).status ? (d as Record<string, unknown>) : null;
      cache.set(host, v); setData(v);
    });
  }, []);
  return data;
}
