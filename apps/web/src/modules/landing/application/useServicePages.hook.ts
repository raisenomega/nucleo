import { useCallback, useEffect, useState } from "react";
import { type FetchState, initFetchState, readyState, errorState } from "@shared/types/fetch-state.types";
import type { IServicePagesRepository, ServicePageAdmin } from "@landing/domain/service-page-admin.types";

// Lista de páginas de servicio del tenant (FetchState + reload).
export function useServicePages(repo: IServicePagesRepository) {
  const [state, setState] = useState<FetchState<ServicePageAdmin[]>>(initFetchState());
  const reload = useCallback(() => {
    setState(initFetchState());
    void repo.list().then((r) => setState(readyState(r))).catch(() => setState(errorState()));
  }, [repo]);
  useEffect(() => { reload(); }, [reload]);
  return { state, reload };
}

// Página única por id (para el editor).
export function useServicePage(repo: IServicePagesRepository, id: string) {
  const [page, setPage] = useState<ServicePageAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); void repo.get(id).then((p) => { setPage(p); setLoading(false); }); }, [repo, id]);
  return { page, loading, setPage };
}
