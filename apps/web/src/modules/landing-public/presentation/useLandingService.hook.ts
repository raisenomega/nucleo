import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { type FetchState, initFetchState, readyState, notFoundState, errorState } from "@shared/types/fetch-state.types";
import { createTtlCache } from "@shared/lib/ttl-cache";
import { TTL_SHORT_60S } from "@shared/lib/ttl-cache.constants";
import type { ServiceDetail } from "@landing-public/domain/landing-service-detail.types";
import type { HomeService } from "@landing-public/domain/landing-home.types";

type ServiceData = { service: ServiceDetail; related: HomeService[] };
const cache = createTtlCache<ServiceData>(TTL_SHORT_60S);

// Fetch _public_get_landing_service(host, slug). Cache TTL 60s por (host|slug). FetchState unificado.
export function useLandingService(slug: string): FetchState<ServiceData> {
  const [state, setState] = useState<FetchState<ServiceData>>(initFetchState<ServiceData>());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${window.location.hostname}|${slug}`;
    const cached = cache.get(key);
    if (cached) { setState(readyState(cached)); return; }
    void supabase.rpc("_public_get_landing_service", { _hostname: window.location.hostname, _service_slug: slug }).then(({ data: d, error }) => {
      const r = d as { status?: string; code?: string; service?: ServiceDetail; related?: HomeService[] } | null;
      if (error || !r) return setState(errorState());
      if (r.status === "error") { if (r.code === "not_found") setState(notFoundState()); else setState(errorState()); return; }
      const v = { service: r.service as ServiceDetail, related: r.related ?? [] }; cache.set(key, v); setState(readyState(v));
    });
  }, [slug]);
  return state;
}
