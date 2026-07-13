import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { createTtlCache } from "@shared/lib/ttl-cache";
import { TTL_SHORT_60S } from "@shared/lib/ttl-cache.constants";
import type { ItemHighlight } from "@shared/types/item-highlight.types";

export type ItemKind = "product" | "service" | "package";
export interface ItemDetail { longDescription: string | null; gallery: string[]; highlights: ItemHighlight[] }
const cache = createTtlCache<ItemDetail>(TTL_SHORT_60S);

function fetchRow(kind: ItemKind, slug: string): PromiseLike<Record<string, unknown> | undefined> {
  const host = window.location.hostname;
  const p = kind === "product" ? supabase.rpc("_public_get_landing_product", { _hostname: host, _product_slug: slug })
    : kind === "service" ? supabase.rpc("_public_get_landing_service", { _hostname: host, _service_slug: slug })
      : supabase.rpc("_public_get_landing_package", { _hostname: host, _package_slug: slug });
  const root = kind === "product" ? "product" : kind === "service" ? "service" : "package";
  return p.then(({ data }) => (data as Record<string, Record<string, unknown>> | null)?.[root]);
}

// Detalle on-demand (long_description + gallery + highlights) vía los RPC de detalle existentes (to_jsonb → cols nuevas
// fluyen solas). Se dispara solo con enabled=true (toggle del card / apertura del popup). Cache TTL 60s compartido.
export function useItemDetail(kind: ItemKind, slug: string, enabled: boolean): { detail: ItemDetail | null; loading: boolean } {
  const [detail, setDetail] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const key = `${kind}|${window.location.hostname}|${slug}`;
    const cached = cache.get(key);
    if (cached) { setDetail(cached); return; }
    setLoading(true);
    void fetchRow(kind, slug).then((row) => {
      const gallery = [row?.primary_image_url as string | null, ...((row?.gallery_images as string[] | null) ?? [])].filter((u): u is string => !!u);
      const v: ItemDetail = { longDescription: (row?.long_description as string | null) ?? null, gallery, highlights: (row?.highlights as ItemHighlight[] | null) ?? [] };
      cache.set(key, v); setDetail(v); setLoading(false);
    });
  }, [kind, slug, enabled]);
  return { detail, loading };
}
