import { useCallback, useEffect, useState } from "react";
import type { ExtraPayment, ExtraPaymentFormData, IExtraPaymentRepository } from "@finance/domain/extraordinary.types";

// Recibe el repositorio por inyección (DI) — NO importa infrastructure (A9 + oráculo #3).
export function useExtraordinary(repo: IExtraPaymentRepository) {
  const [items, setItems] = useState<ExtraPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const r = await repo.list();
    setItems(r.ok ? r.value : []);
    setIsLoading(false);
  }, [repo]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (d: ExtraPaymentFormData) => {
    const r = await repo.create(d);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  const update = useCallback(async (id: string, d: ExtraPaymentFormData) => {
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
