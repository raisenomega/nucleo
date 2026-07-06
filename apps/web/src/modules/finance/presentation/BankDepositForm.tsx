import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
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
  const field = "h-12 w-full rounded-lg border border-border bg-background px-3 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onCancel}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="font-display text-xl font-bold text-primary">{t("deposit")}</h2>
        <button type="button" onClick={onCancel} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="flex flex-1 flex-col gap-4 p-4 md:p-6">
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
        <div className="mt-auto flex gap-2">
          <button type="submit" className="min-h-[48px] flex-1 rounded-lg bg-primary text-primary-foreground px-4 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onCancel} className="min-h-[48px] rounded-lg bg-secondary text-foreground px-4 font-body">{t("cancel")}</button>
        </div>
      </form>
    </ScreenModal>
  );
}
