import { useCallback, useEffect, useState } from "react";
import { initFetchState, readyState, notFoundState, errorState, type FetchState } from "@shared/types/fetch-state.types";
import type { IOrdersRepository, Order } from "@orders/domain/order.types";

// Orden individual por id. FetchState (loading/ready/notfound/error).
export function useOrder(repo: IOrdersRepository, id: string) {
  const [state, setState] = useState<FetchState<Order>>(initFetchState);
  const load = useCallback(async () => {
    setState(initFetchState());
    try { const o = await repo.get(id); setState(o ? readyState(o) : notFoundState()); }
    catch { setState(errorState()); }
  }, [repo, id]);
  useEffect(() => { void load(); }, [load]);
  return { state, reload: load };
}
