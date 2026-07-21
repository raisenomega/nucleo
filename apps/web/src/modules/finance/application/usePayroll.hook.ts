import { useCallback, useEffect, useState } from "react";
import type { Payroll, PayrollFormData, IPayrollRepository, WorkerType, PayrollPreviewCtx } from "@finance/domain/payroll.types";

// Recibe el repositorio por inyección (DI) — NO importa infrastructure (A9 + oráculo #3).
export function usePayroll(repo: IPayrollRepository) {
  const [items, setItems] = useState<Payroll[]>([]);
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

  const create = useCallback(async (d: PayrollFormData) => {
    const r = await repo.create(d);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  const update = useCallback(async (id: string, d: PayrollFormData) => {
    const r = await repo.update(id, d);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  const remove = useCallback(async (id: string) => {
    const r = await repo.remove(id);
    if (r.ok) await refresh();
    return r;
  }, [repo, refresh]);

  const preview = useCallback((gross: number, worker: WorkerType, ctx?: PayrollPreviewCtx) => repo.preview(gross, worker, ctx), [repo]);

  return { items, isLoading, create, update, remove, refresh, preview };
}
