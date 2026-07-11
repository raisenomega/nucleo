import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import type { CatalogItem } from "@landing-public/domain/landing-catalog.types";

const cache = new Map<string, CatalogItem[]>();

// Trae todos los items activos+publicados del tenant (products+services+packages) para el dropdown de quote.
export function useLandingCatalogItems() {
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    if (cache.has(host)) { setItems(cache.get(host) ?? []); return; }
    void supabase.rpc("_public_get_landing_catalog", { _hostname: host, _type: "all", _page_size: 100 }).then(({ data, error: e }) => {
      const d = data as { items?: CatalogItem[]; status?: string } | null;
      if (e || !d || d.status === "error") { setError(true); return; }
      const list = d.items ?? []; cache.set(host, list); setItems(list);
    });
  }, []);
  return {
    products: (items ?? []).filter((i) => i.kind === "product"),
    services: (items ?? []).filter((i) => i.kind === "service"),
    packages: (items ?? []).filter((i) => i.kind === "package"),
    loading: items === null && !error, error,
  };
}
