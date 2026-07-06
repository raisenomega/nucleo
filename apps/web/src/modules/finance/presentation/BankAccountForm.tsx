import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { BankAccountFormData, AccountType } from "@finance/domain/bank-account.types";

const EMPTY: BankAccountFormData = { bankName: "", accountLast4: "", accountType: "checking", isPrimary: false };

export function BankAccountForm({ onSubmit, onCancel }: {
  onSubmit: (d: BankAccountFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<BankAccountFormData>(EMPTY);
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-6">
        <h2 className="font-body font-bold">{t("addAccount")}</h2>
        <label className="block space-y-1"><span className={lbl}>{t("bankName")}</span>
          <input value={f.bankName} onChange={(e) => setF({ ...f, bankName: e.target.value })} className={field} required /></label>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1"><span className={lbl}>{t("accountLast4")}</span>
            <input value={f.accountLast4} maxLength={4} onChange={(e) => setF({ ...f, accountLast4: e.target.value })} className={field} /></label>
          <label className="space-y-1"><span className={lbl}>{t("accountType")}</span>
            <select value={f.accountType} onChange={(e) => setF({ ...f, accountType: e.target.value as AccountType })} className={field}>
              <option value="checking">{t("checking")}</option><option value="savings">{t("savings")}</option>
            </select></label>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isPrimary} onChange={(e) => setF({ ...f, isPrimary: e.target.checked })} /> {t("isPrimary")}</label>
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
        </div>
      </form>
    </div>
  );
}
