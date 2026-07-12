import { useCallback, useEffect, useState } from "react";
import type { IReservableServicesRepository, ReservableService, ServiceInput, Result } from "@agenda/domain/reservable-service.types";

export function useReservableServices(repo: IReservableServicesRepository, tenantId?: string | null) {
  const [list, setList] = useState<ReservableService[]>([]);
  const reload = useCallback(async () => setList(await repo.list()), [repo]);
  useEffect(() => { void reload(); }, [reload]);
  const update = useCallback(async (id: string, rt: string, rp: number | null): Promise<Result> => {
    const r = await repo.update(id, rt, rp); if (r.ok) await reload(); return r;
  }, [repo, reload]);
  const create = useCallback(async (i: ServiceInput): Promise<ReservableService | null> => {
    if (!tenantId) return null; const s = await repo.create(tenantId, i); if (s) await reload(); return s;
  }, [repo, tenantId, reload]);
  return { list, update, create, reload };
}
