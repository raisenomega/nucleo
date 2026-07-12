import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { type FetchState, initFetchState, readyState, errorState } from "@shared/types/fetch-state.types";
import { createTtlCache } from "@shared/lib/ttl-cache";
import { TTL_SHORT_60S } from "@shared/lib/ttl-cache.constants";
import type { CatalogItem } from "@landing-public/domain/landing-catalog.types";

export type CatalogItems = { products: CatalogItem[]; services: CatalogItem[]; packages: CatalogItem[] };
const cache = createTtlCache<CatalogItem[]>(TTL_SHORT_60S);
const split = (list: CatalogItem[]): CatalogItems => ({
  products: list.filter((i) => i.kind === "product"),
  services: list.filter((i) => i.kind === "service"),
  packages: list.filter((i) => i.kind === "package"),
});

// Trae todos los items activos+publicados del tenant (products+services+packages) para el dropdown. FetchState unificado.
export function useLandingCatalogItems(): FetchState<CatalogItems> {
  const [state, setState] = useState<FetchState<CatalogItems>>(initFetchState<CatalogItems>());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const cached = cache.get(host);
    if (cached) { setState(readyState(split(cached))); return; }
    void supabase.rpc("_public_get_landing_catalog", { _hostname: host, _type: "all", _page_size: 100 }).then(({ data, error: e }) => {
      const d = data as { items?: CatalogItem[]; status?: string } | null;
      if (e || !d || d.status === "error") return setState(errorState());
      const list = d.items ?? []; cache.set(host, list); setState(readyState(split(list)));
    });
  }, []);
  return state;
}
