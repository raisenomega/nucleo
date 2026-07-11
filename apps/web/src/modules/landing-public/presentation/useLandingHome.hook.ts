import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import type { LandingHome } from "@landing-public/domain/landing-home.types";

const cache = new Map<string, LandingHome | null>();

// Fetch _public_get_landing_home por hostname (client-side). Cache en memoria por host. null si no aplica.
export function useLandingHome(): LandingHome | null {
  const [data, setData] = useState<LandingHome | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    if (cache.has(host)) { setData(cache.get(host) ?? null); return; }
    void supabase.rpc("_public_get_landing_home", { _hostname: host }).then(({ data: d }) => {
      const v = d && !(d as { status?: string }).status ? (d as LandingHome) : null;
      cache.set(host, v); setData(v);
    });
  }, []);
  return data;
}
