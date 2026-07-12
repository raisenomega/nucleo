import { useCallback, useEffect, useState } from "react";
import { createTtlCache } from "@shared/lib/ttl-cache";
import { TTL_SHORT_60S } from "@shared/lib/ttl-cache.constants";
import { initFetchState, readyState, errorState, isReady, type FetchState } from "@shared/types/fetch-state.types";
import type { IOrdersRepository, Order, OrderFilters } from "@orders/domain/order.types";

const PAGE = 25;
const cache = createTtlCache<{ items: Order[]; total: number }>(TTL_SHORT_60S);

// Lista de órdenes con filtros (status/fecha/búsqueda) + load-more acumulativo + cache TTL 60s.
export function useOrders(repo: IOrdersRepository, filters: OrderFilters) {
  const [state, setState] = useState<FetchState<Order[]>>(initFetchState);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const key = JSON.stringify(filters);

  const load = useCallback(async (p: number) => {
    setBusy(true);
    try {
      const ck = `${key}|${p}`;
      const res = cache.get(ck) ?? await repo.list(filters, p * PAGE, PAGE);
      cache.set(ck, res); setTotal(res.total);
      setState((prev) => (p === 0 || !isReady(prev) ? readyState(res.items) : readyState([...prev.data, ...res.items])));
    } catch { setState(errorState()); }
    setBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, repo]);

  useEffect(() => { setPage(0); void load(0); }, [key, load]);
  const loadMore = () => { const n = page + 1; setPage(n); void load(n); };
  const hasMore = isReady(state) ? state.data.length < total : false;
  const reload = () => { cache.clear(); setPage(0); void load(0); };
  return { state, total, busy, hasMore, loadMore, reload };
}
