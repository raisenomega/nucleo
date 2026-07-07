import { useCallback, useEffect, useState } from "react";
import type { IAccountsReceivableRepository, ARSnapshot } from "@finance/domain/accounts-receivable.types";

// DI del repo. Carga las deudas pendientes; cobrar/perdonar refrescan.
export function useAccountsReceivable(repo: IAccountsReceivableRepository) {
  const [snapshot, setSnapshot] = useState<ARSnapshot | null>(null);
  const refresh = useCallback(async () => { setSnapshot(await repo.getAll()); }, [repo]);
  useEffect(() => { void refresh(); }, [refresh]);
  const collect = useCallback(async (stopId: string, methodId: string) => {
    const r = await repo.collectDebt(stopId, methodId); if (r.ok) await refresh(); return r;
  }, [repo, refresh]);
  const forgive = useCallback(async (stopId: string, reason: string) => {
    const r = await repo.forgiveDebt(stopId, reason); if (r.ok) await refresh(); return r;
  }, [repo, refresh]);
  return { snapshot, collect, forgive, refresh };
}
