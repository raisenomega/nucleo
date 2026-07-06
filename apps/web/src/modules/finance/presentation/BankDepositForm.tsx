import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import type { BankDepositFormData } from "@finance/domain/reconciliation.types";
import type { BankAccount } from "@finance/domain/bank-account.types";

const EMPTY: BankDepositFormData = { bankAccountId: "", amount: 0, depositType: "cash", depositDate: new Date().toISOString().slice(0, 10), referenceNumber: "", notes: "", evidenceUrls: [] };

export function BankDepositForm({ accounts, onSubmit, onCancel }: {
  accounts: readonly BankAccount[]; onSubmit: (d: BankDepositFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const [f, setF] = useState<BankDepositFormData>(EMPTY);
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-6">
        <h2 className="font-body font-bold">{t("deposit")}</h2>
        <label className="block space-y-1"><span className={lbl}>{t("bankName")}</span>
          <select value={f.bankAccountId} onChange={(e) => setF({ ...f, bankAccountId: e.target.value })} className={field} required>
            <option value="">—</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.bankName}</option>)}
          </select></label>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1"><span className={lbl}>{t("amount")}</span>
            <input type="number" step="0.01" min="0" value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} className={field} required /></label>
          <label className="space-y-1"><span className={lbl}>{t("depositType")}</span>
            <select value={f.depositType} onChange={(e) => setF({ ...f, depositType: e.target.value })} className={field}>
              <option value="cash">{t("cash")}</option><option value="check">{t("check")}</option>
              <option value="transfer">{t("transfer")}</option><option value="other">{t("other")}</option>
            </select></label>
          <label className="space-y-1"><span className={lbl}>{t("date")}</span>
            <input type="date" value={f.depositDate} onChange={(e) => setF({ ...f, depositDate: e.target.value })} className={field} /></label>
          {f.depositType === "check" && <label className="space-y-1"><span className={lbl}>{t("referenceNumber")}</span>
            <input value={f.referenceNumber} onChange={(e) => setF({ ...f, referenceNumber: e.target.value })} className={field} /></label>}
        </div>
        <label className="block space-y-1"><span className={lbl}>{t("notes")}</span>
          <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={field} /></label>
        <EvidenceUpload tenantId={session?.tenantId ?? ""} value={[...f.evidenceUrls]} onChange={(paths) => setF({ ...f, evidenceUrls: paths })} />
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
        </div>
      </form>
    </div>
  );
}
