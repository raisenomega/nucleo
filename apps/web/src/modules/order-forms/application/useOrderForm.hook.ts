import { useCallback, useEffect, useState } from "react";
import { initFetchState, readyState, notFoundState, errorState, type FetchState } from "@shared/types/fetch-state.types";
import type { IOrderFormsRepository, OrderFormFull } from "@order-forms/domain/order-form.types";

// Form completo (con campos) por id. FetchState.
export function useOrderForm(repo: IOrderFormsRepository, id: string) {
  const [state, setState] = useState<FetchState<OrderFormFull>>(initFetchState);
  const load = useCallback(async () => {
    setState(initFetchState());
    try { const f = await repo.get(id); setState(f ? readyState(f) : notFoundState()); } catch { setState(errorState()); }
  }, [repo, id]);
  useEffect(() => { void load(); }, [load]);
  return { state, reload: load };
}
