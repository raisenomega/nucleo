import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChartAccount, AccountFormData, IChartOfAccountsRepository } from "@accounting/domain/chart-of-accounts.types";
import { buildAccountTree } from "@accounting/domain/build-account-tree";

// DI del repo. Carga el plan de cuentas; expone lista plana, árbol y mutaciones que refrescan.
export function useChartOfAccounts(repo: IChartOfAccountsRepository) {
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setAccounts(await repo.list()); setLoading(false); }, [repo]);
  useEffect(() => { void refresh(); }, [refresh]);

  const tree = useMemo(() => buildAccountTree(accounts), [accounts]);
  const headers = useMemo(() => accounts.filter((a) => a.isHeader), [accounts]);

  const create = useCallback(async (d: AccountFormData) => { const r = await repo.create(d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const update = useCallback(async (id: string, d: Partial<AccountFormData>) => { const r = await repo.update(id, d); if (r.ok) await refresh(); return r; }, [repo, refresh]);
  const toggleActive = useCallback(async (id: string, active: boolean) => { const r = await repo.toggleActive(id, active); if (r.ok) await refresh(); return r; }, [repo, refresh]);

  return { accounts, tree, headers, loading, create, update, toggleActive, refresh };
}
