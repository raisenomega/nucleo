import { useCallback, useEffect, useState } from "react";
import type { IReservableServicesRepository, ReservableService, Result } from "@agenda/domain/reservable-service.types";

export function useReservableServices(repo: IReservableServicesRepository) {
  const [list, setList] = useState<ReservableService[]>([]);
  const load = useCallback(async () => setList(await repo.list()), [repo]);
  useEffect(() => { void load(); }, [load]);
  const update = useCallback(async (id: string, rt: string, rp: number | null): Promise<Result> => {
    const r = await repo.update(id, rt, rp); if (r.ok) await load(); return r;
  }, [repo, load]);
  return { list, update };
}
