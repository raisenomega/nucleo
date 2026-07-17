import { useCallback, useEffect, useState } from "react";
import type {
  ExternalWorker, ExternalWorkerFormData, IExternalWorkerRepository,
} from "@finance/domain/external-worker.types";

// Recibe el repositorio por inyección (DI) — NO importa infrastructure.
export function useExternalWorkers(repo: IExternalWorkerRepository) {
  const [items, setItems] = useState<ExternalWorker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const r = await repo.list();
    setItems(r.ok ? r.value : []);
    setIsLoading(false);
  }, [repo]);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async (d: ExternalWorkerFormData) => {
    const r = await repo.create(d);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  const update = useCallback(async (id: string, d: ExternalWorkerFormData) => {
    const r = await repo.update(id, d);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  const remove = useCallback(async (id: string) => {
    const r = await repo.remove(id);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  return { items, isLoading, create, update, remove, refresh };
}
