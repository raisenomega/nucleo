import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { BankBalanceFormData } from "@finance/domain/reconciliation.types";
import type { BankAccount } from "@finance/domain/bank-account.types";

const EMPTY: BankBalanceFormData = { bankAccountId: "", openingBalance: 0, realBalance: 0, cutoffDate: new Date().toISOString().slice(0, 10) };

export function BankBalanceForm({ accounts, onSubmit, onCancel }: {
  accounts: readonly BankAccount[]; onSubmit: (d: BankBalanceFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<BankBalanceFormData>(EMPTY);
  const field = "h-12 w-full rounded-lg border border-border bg-background px-3 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onCancel}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="font-display text-xl font-bold text-foreground">{t("registerBalance")}</h2>
        <button type="button" onClick={onCancel} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <label className="block space-y-1"><span className={lbl}>{t("bankName")}</span>
          <select value={f.bankAccountId} onChange={(e) => setF({ ...f, bankAccountId: e.target.value })} className={field} required>
            <option value="">—</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.bankName}</option>)}
          </select></label>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1"><span className={lbl}>{t("openingBalance")}</span>
            <input type="number" step="0.01" value={f.openingBalance || ""} onChange={(e) => setF({ ...f, openingBalance: Number(e.target.value) })} className={field} /></label>
          <label className="space-y-1"><span className={lbl}>{t("realBalance")}</span>
            <input type="number" step="0.01" value={f.realBalance || ""} onChange={(e) => setF({ ...f, realBalance: Number(e.target.value) })} className={field} /></label>
        </div>
        <label className="block space-y-1"><span className={lbl}>{t("cutoff")}</span>
          <input type="date" value={f.cutoffDate} onChange={(e) => setF({ ...f, cutoffDate: e.target.value })} className={field} /></label>
        <div className="mt-auto flex gap-2">
          <button type="submit" className="min-h-[48px] flex-1 rounded-lg bg-primary text-primary-foreground px-4 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onCancel} className="min-h-[48px] rounded-lg bg-secondary text-foreground px-4 font-body">{t("cancel")}</button>
        </div>
      </form>
    </ScreenModal>
  );
}
