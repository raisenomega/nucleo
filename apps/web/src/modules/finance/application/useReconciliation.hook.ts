import { useCallback, useEffect, useState } from "react";
import type {
  IReconciliationRepository, ReconciliationSnapshot, RetentionDeposit, RetentionDepositFormData,
} from "@finance/domain/reconciliation.types";
import type { BankAccount, BankAccountFormData, IBankAccountRepository } from "@finance/domain/bank-account.types";

// DI de 2 repos. Carga snapshot + cuentas + depósitos del `month` (yyyy-mm) en paralelo.
export function useReconciliation(
  reconRepo: IReconciliationRepository, bankRepo: IBankAccountRepository, month: string,
) {
  const [snapshot, setSnapshot] = useState<ReconciliationSnapshot | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [deposits, setDeposits] = useState<RetentionDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [s, a, d] = await Promise.all([reconRepo.getSnapshot(month), bankRepo.list(), reconRepo.listDeposits(month)]);
    setSnapshot(s); setBankAccounts([...a]); setDeposits([...d]); setLoading(false);
  }, [reconRepo, bankRepo, month]);

  useEffect(() => { void refresh(); }, [refresh]);

  const addAccount = useCallback(async (fd: BankAccountFormData) => {
    const r = await bankRepo.create(fd); if (r.ok) await refresh(); return r;
  }, [bankRepo, refresh]);
  const removeAccount = useCallback(async (id: string) => {
    const r = await bankRepo.remove(id); if (r.ok) await refresh(); return r;
  }, [bankRepo, refresh]);
  const addDeposit = useCallback(async (fd: RetentionDepositFormData) => {
    const r = await reconRepo.addDeposit(month, fd); if (r.ok) await refresh(); return r;
  }, [reconRepo, month, refresh]);

  return { snapshot, bankAccounts, deposits, loading, addAccount, removeAccount, addDeposit };
}
