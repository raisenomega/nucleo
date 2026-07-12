import { useCallback, useEffect, useState } from "react";
import { createTtlCache } from "@shared/lib/ttl-cache";
import { TTL_SHORT_60S } from "@shared/lib/ttl-cache.constants";
import { initFetchState, readyState, errorState, type FetchState } from "@shared/types/fetch-state.types";
import type { IOrderFormsRepository, OrderFormSummary } from "@order-forms/domain/order-form.types";

const cache = createTtlCache<OrderFormSummary[]>(TTL_SHORT_60S);

// Lista de formularios del tenant. FetchState + cache TTL 60s.
export function useOrderForms(repo: IOrderFormsRepository) {
  const [state, setState] = useState<FetchState<OrderFormSummary[]>>(initFetchState);
  const load = useCallback(async () => {
    const c = cache.get("all"); if (c) { setState(readyState(c)); return; }
    try { const r = await repo.list(); cache.set("all", r); setState(readyState(r)); } catch { setState(errorState()); }
  }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const reload = () => { cache.clear(); void load(); };
  return { state, reload };
}
