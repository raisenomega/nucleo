import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { type FetchState, initFetchState, readyState, errorState } from "@shared/types/fetch-state.types";
import type { CatalogItem, CatalogPage } from "@landing-public/domain/landing-catalog.types";

const cache = new Map<string, CatalogPage>();

// Catálogo paginado con load-more. FetchState de la página en curso + items acumulados. Cache por host|cat|type|page.
export function useLandingCatalog(category: string | null, type: string) {
  const [state, setState] = useState<FetchState<CatalogPage>>(initFetchState<CatalogPage>());
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const pageRef = useRef(1);
  const fetchPage = useCallback((page: number) => {
    const host = window.location.hostname;
    const key = `${host}|${category ?? ""}|${type}|${page}`;
    setState(initFetchState());
    const apply = (d: CatalogPage) => {
      setItems((prev) => (page === 1 ? d.items : [...prev, ...d.items]));
      setTotal(d.total); pageRef.current = page; setState(readyState(d));
    };
    if (cache.has(key)) return apply(cache.get(key) as CatalogPage);
    void supabase.rpc("_public_get_landing_catalog", { _hostname: host, _category_slug: category, _type: type, _page: page, _page_size: 24 }).then(({ data, error }) => {
      const d = data as (CatalogPage & { status?: string }) | null;
      if (error || !d || d.status === "error") return setState(errorState());
      cache.set(key, d); apply(d);
    });
  }, [category, type]);
  useEffect(() => { setItems([]); fetchPage(1); }, [fetchPage]);
  return { state, items, hasMore: items.length < total, loadMore: () => fetchPage(pageRef.current + 1), retry: () => fetchPage(1) };
}
