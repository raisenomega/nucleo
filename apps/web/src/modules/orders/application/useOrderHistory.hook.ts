import { useCallback, useEffect, useState } from "react";
import { initFetchState, readyState, errorState, type FetchState } from "@shared/types/fetch-state.types";
import type { IOrderHistoryRepository, OrderHistoryEvent } from "@orders/domain/order-status-history.types";

// Historial de estados de una orden (más reciente primero).
export function useOrderHistory(repo: IOrderHistoryRepository, orderId: string) {
  const [state, setState] = useState<FetchState<OrderHistoryEvent[]>>(initFetchState);
  const load = useCallback(async () => {
    try { setState(readyState(await repo.list(orderId))); } catch { setState(errorState()); }
  }, [repo, orderId]);
  useEffect(() => { void load(); }, [load]);
  return { state, reload: load };
}
