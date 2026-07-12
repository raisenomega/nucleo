import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { type FetchState, initFetchState, readyState, notFoundState, errorState } from "@shared/types/fetch-state.types";
import { createTtlCache } from "@shared/lib/ttl-cache";
import { TTL_MEDIUM_5M } from "@shared/lib/ttl-cache.constants";
import type { LandingHome } from "@landing-public/domain/landing-home.types";

const cache = createTtlCache<LandingHome>(TTL_MEDIUM_5M);

// Fetch _public_get_landing_home por hostname (client-side). Cache TTL 5min por host. FetchState unificado.
export function useLandingHome(): FetchState<LandingHome> {
  const [state, setState] = useState<FetchState<LandingHome>>(initFetchState<LandingHome>());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const cached = cache.get(host);
    if (cached) { setState(readyState(cached)); return; }
    void supabase.rpc("_public_get_landing_home", { _hostname: host }).then(({ data: d, error }) => {
      if (error) return setState(errorState());
      const v = d && !(d as { status?: string }).status ? (d as LandingHome) : null;
      if (v) cache.set(host, v); setState(v ? readyState(v) : notFoundState());
    });
  }, []);
  return state;
}
