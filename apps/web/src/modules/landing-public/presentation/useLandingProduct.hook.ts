import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { type FetchState, initFetchState, readyState, notFoundState, errorState } from "@shared/types/fetch-state.types";
import { createTtlCache } from "@shared/lib/ttl-cache";
import { TTL_SHORT_60S } from "@shared/lib/ttl-cache.constants";
import type { ProductFull } from "@landing-public/domain/landing-product-detail.types";
import type { HomeProduct } from "@landing-public/domain/landing-home.types";

type ProductData = { product: ProductFull; related: HomeProduct[] };
const cache = createTtlCache<ProductData>(TTL_SHORT_60S);

// Fetch _public_get_landing_product(host, slug). Cache TTL 60s por (host|slug). FetchState unificado.
export function useLandingProduct(slug: string): FetchState<ProductData> {
  const [state, setState] = useState<FetchState<ProductData>>(initFetchState<ProductData>());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${window.location.hostname}|${slug}`;
    const cached = cache.get(key);
    if (cached) { setState(readyState(cached)); return; }
    void supabase.rpc("_public_get_landing_product", { _hostname: window.location.hostname, _product_slug: slug }).then(({ data: d, error }) => {
      const r = d as { status?: string; code?: string; product?: ProductFull; related?: HomeProduct[] } | null;
      if (error || !r) return setState(errorState());
      if (r.status === "error") { if (r.code === "not_found") setState(notFoundState()); else setState(errorState()); return; }
      const v = { product: r.product as ProductFull, related: r.related ?? [] }; cache.set(key, v); setState(readyState(v));
    });
  }, [slug]);
  return state;
}
