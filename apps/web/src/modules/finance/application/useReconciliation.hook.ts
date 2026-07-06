import { useCallback, useEffect, useState } from "react";
import type {
  IReconciliationRepository, ReconciliationSnapshot, BankDepositFormData, BankBalanceFormData,
} from "@finance/domain/reconciliation.types";
import type { BankAccount, BankAccountFormData, IBankAccountRepository } from "@finance/domain/bank-account.types";

// DI de 2 repos. Carga snapshot + cuentas del `month` (yyyy-mm) en paralelo.
export function useReconciliation(
  reconRepo: IReconciliationRepository, bankRepo: IBankAccountRepository, month: string,
) {
  const [snapshot, setSnapshot] = useState<ReconciliationSnapshot | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [s, a] = await Promise.all([reconRepo.getSnapshot(month), bankRepo.list()]);
    setSnapshot(s); setBankAccounts([...a]); setLoading(false);
  }, [reconRepo, bankRepo, month]);

  useEffect(() => { void refresh(); }, [refresh]);

  const addAccount = useCallback(async (fd: BankAccountFormData) => {
    const r = await bankRepo.create(fd); if (r.ok) await refresh(); return r;
  }, [bankRepo, refresh]);
  const removeAccount = useCallback(async (id: string) => {
    const r = await bankRepo.remove(id); if (r.ok) await refresh(); return r;
  }, [bankRepo, refresh]);
  const addBankDeposit = useCallback(async (d: BankDepositFormData) => {
    const r = await reconRepo.addBankDeposit(d); if (r.ok) await refresh(); return r;
  }, [reconRepo, refresh]);
  const upsertBankBalance = useCallback(async (d: BankBalanceFormData) => {
    const r = await reconRepo.upsertBankBalance(month, d); if (r.ok) await refresh(); return r;
  }, [reconRepo, month, refresh]);

  return { snapshot, bankAccounts, loading, addAccount, removeAccount, addBankDeposit, upsertBankBalance };
}
