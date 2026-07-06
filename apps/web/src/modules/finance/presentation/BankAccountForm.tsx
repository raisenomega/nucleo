import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { BankAccountFormData, AccountType } from "@finance/domain/bank-account.types";

const EMPTY: BankAccountFormData = { bankName: "", accountLast4: "", accountType: "checking", isPrimary: false };

export function BankAccountForm({ onSubmit, onCancel }: {
  onSubmit: (d: BankAccountFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<BankAccountFormData>(EMPTY);
  const field = "h-12 w-full rounded-lg border border-border bg-background px-3 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onCancel}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="font-display text-xl font-bold text-primary">{t("addAccount")}</h2>
        <button type="button" onClick={onCancel} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="flex flex-1 flex-col gap-4 p-4 md:p-6">
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
        <div className="mt-auto flex gap-2">
          <button type="submit" className="min-h-[48px] flex-1 rounded-lg bg-primary text-primary-foreground px-4 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onCancel} className="min-h-[48px] rounded-lg bg-secondary text-foreground px-4 font-body">{t("cancel")}</button>
        </div>
      </form>
    </ScreenModal>
  );
}
