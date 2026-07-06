import { Plus, Trash2, Landmark } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import type { BankPanel } from "@finance/domain/reconciliation.types";
import type { BankAccount } from "@finance/domain/bank-account.types";

export function ReconciliationBankPanel({ bank, accounts, onAddAccount, onDeposit, onRegisterBalance, onRemoveAccount }: {
  bank: BankPanel; accounts: readonly BankAccount[];
  onAddAccount?: () => void; onDeposit?: () => void; onRegisterBalance?: () => void; onRemoveAccount?: (id: string) => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const canBank = can("reconciliation", "bank"); // saldos/depósitos gateados por reconciliation.bank
  const dataOf = (name: string) => bank.accounts.find((a) => a.bankName === name);
  const line = (label: string, v: number, sign?: string, bold?: boolean) => (
    <div className={`flex justify-between ${bold ? "border-t border-border pt-1 font-bold" : ""}`}>
      <span className="text-muted-foreground">{sign} {label}</span><span>{formatCurrency(v)}</span></div>
  );
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-body font-bold text-primary">{t("bankAccounts")}</h2>
        <div className="flex gap-2 text-sm">
          {onAddAccount && <button type="button" onClick={onAddAccount} className="rounded-lg bg-secondary text-foreground px-3 py-1.5 font-bold">+ {t("addAccount")}</button>}
          {onRegisterBalance && <button type="button" onClick={onRegisterBalance} className="rounded-lg bg-secondary text-foreground px-3 py-1.5 font-bold">{t("registerBalance")}</button>}
          {onDeposit && <button type="button" onClick={onDeposit} className="flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 font-bold"><Plus className="h-4 w-4" /> {t("deposit")}</button>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => {
          const d = dataOf(a.bankName);
          return (
            <div key={a.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 font-semibold"><Landmark className="h-4 w-4 text-primary" />{a.bankName}{a.isPrimary ? " ★" : ""}</span>
                {onRemoveAccount && <button type="button" onClick={() => onRemoveAccount(a.id)} className="text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
              </div>
              {canBank && d ? (
                <div className="mt-2 space-y-0.5 text-xs">
                  <div className="flex justify-between text-muted-foreground"><span>{t("openingBalance")}</span><span>{formatCurrency(d.openingBalance)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>+ {t("deposits")}</span><span>{formatCurrency(d.deposits)}</span></div>
                  <div className="flex justify-between border-t border-border pt-0.5 text-sm font-bold text-primary"><span>= {t("calculatedBalance")}</span><span>{formatCurrency(d.calculatedBalance)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>{t("realBalance")}</span><span>{formatCurrency(d.realBalance)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("difference")}</span><span className={d.difference < 0 ? "text-red-600" : "text-green-600"}>{formatCurrency(d.difference)}</span></div>
                </div>
              ) : <div className="mt-2 text-xs text-muted-foreground">{a.accountLast4 ? `••••${a.accountLast4}` : t(a.accountType)} · {t("notRegistered")}</div>}
            </div>
          );
        })}
        {accounts.length === 0 && <div className="text-xs text-muted-foreground">{t("noRecords")}</div>}
      </div>
      {canBank && (
        <div className="space-y-1 border-t border-border pt-3 text-sm">
          {line(t("openingBalance"), bank.openingBalance)}
          {line(t("deposits"), bank.deposits, "+")}
          {line(t("egresos"), bank.egresos, "−")}
          {line(t("calculatedBalance"), bank.calculatedBalance, "=", true)}
          {line(t("realBalance"), bank.realBalance)}
          <div className="flex justify-between font-bold"><span>{t("difference")}</span>
            <span className={bank.difference === 0 ? "" : "text-yellow-700"}>{formatCurrency(bank.difference)}</span></div>
        </div>
      )}
    </div>
  );
}
