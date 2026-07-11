import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import type { ProductFull } from "@landing-public/domain/landing-product-detail.types";
import type { HomeProduct } from "@landing-public/domain/landing-home.types";

type Data = { product: ProductFull; related: HomeProduct[] } | null;
type Status = "loading" | "ready" | "notfound" | "error";
const cache = new Map<string, Data>();

// Fetch _public_get_landing_product(host, slug). Cache por (host|slug). notfound si code='not_found'.
export function useLandingProduct(slug: string) {
  const [data, setData] = useState<Data>(null);
  const [status, setStatus] = useState<Status>("loading");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `${window.location.hostname}|${slug}`;
    if (cache.has(key)) { const v = cache.get(key) ?? null; setData(v); setStatus(v ? "ready" : "notfound"); return; }
    void supabase.rpc("_public_get_landing_product", { _hostname: window.location.hostname, _product_slug: slug }).then(({ data: d, error }) => {
      const r = d as { status?: string; code?: string; product?: ProductFull; related?: HomeProduct[] } | null;
      if (error || !r) return setStatus("error");
      if (r.status === "error") { if (r.code === "not_found") { cache.set(key, null); setStatus("notfound"); } else setStatus("error"); return; }
      const v = { product: r.product as ProductFull, related: r.related ?? [] }; cache.set(key, v); setData(v); setStatus("ready");
    });
  }, [slug]);
  return { data, status };
}
