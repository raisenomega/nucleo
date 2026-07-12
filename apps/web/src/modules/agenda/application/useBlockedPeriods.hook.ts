import { useCallback, useEffect, useState } from "react";
import type { IBlockedPeriodsRepository, BlockedPeriod, BlockedPeriodInput, Result } from "@agenda/domain/blocked-period.types";

export function useBlockedPeriods(repo: IBlockedPeriodsRepository, tenantId: string | null | undefined) {
  const [list, setList] = useState<BlockedPeriod[]>([]);
  const load = useCallback(async () => setList(await repo.list()), [repo]);
  useEffect(() => { void load(); }, [load]);
  const create = useCallback(async (input: BlockedPeriodInput): Promise<Result> => {
    if (!tenantId) return { ok: false, error: "no-tenant" };
    const r = await repo.create(tenantId, input); if (r.ok) await load(); return r;
  }, [repo, tenantId, load]);
  const remove = useCallback(async (id: string): Promise<Result> => {
    const r = await repo.remove(id); if (r.ok) await load(); return r;
  }, [repo, load]);
  return { list, create, remove };
}
