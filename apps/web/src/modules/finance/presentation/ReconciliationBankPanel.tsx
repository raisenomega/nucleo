import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { BankPanel } from "@finance/domain/reconciliation.types";
import type { BankAccount } from "@finance/domain/bank-account.types";

export function ReconciliationBankPanel({ bank, accounts, onAdd, onRemove }: {
  bank: BankPanel; accounts: readonly BankAccount[]; onAdd: () => void; onRemove: (id: string) => void;
}) {
  const { t } = useI18n();
  const balanceOf = (name: string) => bank.accounts.find((a) => a.bankName === name);
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-body font-bold text-primary">{t("bankAccounts")}</h2>
        <button type="button" onClick={onAdd} className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-bold"><Plus className="h-4 w-4" /> {t("addAccount")}</button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => {
          const b = balanceOf(a.bankName);
          return (
            <div key={a.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{a.bankName}{a.isPrimary ? " ★" : ""}</span>
                <button type="button" onClick={() => onRemove(a.id)} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="text-xs text-muted-foreground">{a.accountLast4 ? `••••${a.accountLast4}` : t(a.accountType)}</div>
              <div className="mt-1 text-lg font-black">{b ? formatCurrency(b.balance) : t("notRegistered")}</div>
              {b && <div className="text-xs text-muted-foreground">{t("cutoff")}: {b.cutoffDate}</div>}
            </div>
          );
        })}
        {accounts.length === 0 && <div className="text-xs text-muted-foreground">{t("noRecords")}</div>}
      </div>
      <div className="flex flex-wrap gap-4 border-t border-border pt-3 text-sm">
        <span>{t("totalBank")}: <b>{formatCurrency(bank.totalBank)}</b></span>
        <span>{t("totalSystem")}: <b>{formatCurrency(bank.totalSystem)}</b></span>
        <span>{t("difference")}: <b className={bank.difference === 0 ? "" : "text-yellow-700"}>{formatCurrency(bank.difference)}</b></span>
      </div>
    </div>
  );
}
