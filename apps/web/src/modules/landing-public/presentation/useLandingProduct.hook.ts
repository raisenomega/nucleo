import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { type FetchState, initFetchState, readyState, notFoundState, errorState } from "@shared/types/fetch-state.types";
import type { ProductFull } from "@landing-public/domain/landing-product-detail.types";
import type { HomeProduct } from "@landing-public/domain/landing-home.types";

type ProductData = { product: ProductFull; related: HomeProduct[] };
const cache = new Map<string, ProductData | null>();

// Fetch _public_get_landing_product(host, slug). Cache por (host|slug). FetchState unificado.
export function useLandingProduct(slug: string): FetchState<ProductData> {
  const [state, setState] = useState<FetchState<ProductData>>(initFetchState<ProductData>());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${window.location.hostname}|${slug}`;
    if (cache.has(key)) { const v = cache.get(key) ?? null; setState(v ? readyState(v) : notFoundState()); return; }
    void supabase.rpc("_public_get_landing_product", { _hostname: window.location.hostname, _product_slug: slug }).then(({ data: d, error }) => {
      const r = d as { status?: string; code?: string; product?: ProductFull; related?: HomeProduct[] } | null;
      if (error || !r) return setState(errorState());
      if (r.status === "error") { if (r.code === "not_found") { cache.set(key, null); setState(notFoundState()); } else setState(errorState()); return; }
      const v = { product: r.product as ProductFull, related: r.related ?? [] }; cache.set(key, v); setState(readyState(v));
    });
  }, [slug]);
  return state;
}
