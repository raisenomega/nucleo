import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { type FetchState, initFetchState, readyState, notFoundState, errorState } from "@shared/types/fetch-state.types";
import type { PackageDetail } from "@landing-public/domain/landing-package-detail.types";
import type { HomePackage } from "@landing-public/domain/landing-home.types";

type PackageData = { pkg: PackageDetail; related: HomePackage[] };
const cache = new Map<string, PackageData | null>();

// Fetch _public_get_landing_package(host, slug) — includeds ya expandidos server-side. FetchState unificado.
export function useLandingPackage(slug: string): FetchState<PackageData> {
  const [state, setState] = useState<FetchState<PackageData>>(initFetchState<PackageData>());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${window.location.hostname}|${slug}`;
    if (cache.has(key)) { const v = cache.get(key) ?? null; setState(v ? readyState(v) : notFoundState()); return; }
    void supabase.rpc("_public_get_landing_package", { _hostname: window.location.hostname, _package_slug: slug }).then(({ data: d, error }) => {
      const r = d as { status?: string; code?: string; package?: PackageDetail; related?: HomePackage[] } | null;
      if (error || !r) return setState(errorState());
      if (r.status === "error") { if (r.code === "not_found") { cache.set(key, null); setState(notFoundState()); } else setState(errorState()); return; }
      const v = { pkg: r.package as PackageDetail, related: r.related ?? [] }; cache.set(key, v); setState(readyState(v));
    });
  }, [slug]);
  return state;
}
