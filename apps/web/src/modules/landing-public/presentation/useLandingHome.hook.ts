import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { type FetchState, initFetchState, readyState, notFoundState, errorState } from "@shared/types/fetch-state.types";
import type { LandingHome } from "@landing-public/domain/landing-home.types";

const cache = new Map<string, LandingHome | null>();

// Fetch _public_get_landing_home por hostname (client-side). FetchState unificado. Cache por host.
export function useLandingHome(): FetchState<LandingHome> {
  const [state, setState] = useState<FetchState<LandingHome>>(initFetchState<LandingHome>());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    if (cache.has(host)) { const v = cache.get(host) ?? null; setState(v ? readyState(v) : notFoundState()); return; }
    void supabase.rpc("_public_get_landing_home", { _hostname: host }).then(({ data: d, error }) => {
      if (error) return setState(errorState());
      const v = d && !(d as { status?: string }).status ? (d as LandingHome) : null;
      cache.set(host, v); setState(v ? readyState(v) : notFoundState());
    });
  }, []);
  return state;
}
