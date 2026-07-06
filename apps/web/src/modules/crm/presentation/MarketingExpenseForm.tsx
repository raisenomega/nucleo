import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import { CategoryPicker } from "@shared/components/CategoryPicker";
import type { MExpenseFormData } from "@crm/domain/marketing.types";

export function MarketingExpenseForm({ channels, initial, onSubmit, onCancel }: {
  channels: readonly string[]; initial: MExpenseFormData;
  onSubmit: (d: MExpenseFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const [f, setF] = useState<MExpenseFormData>(initial);
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-6">
      <h2 className="font-body font-bold">{t("registerExpense")}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CategoryPicker kind="channel" gateModule="marketing" byLabel value={f.channel} onChange={(v) => setF({ ...f, channel: v })} label="channel" />
        <label className="space-y-1"><span className={lbl}>{t("date")}</span>
          <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("amount")}</span>
          <input type="number" step="0.01" min="0" value={f.amount || ""} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("campaignName")}</span>
          <input value={f.campaignName} onChange={(e) => setF({ ...f, campaignName: e.target.value })} className={field} /></label>
        <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("description")}</span>
          <input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={field} /></label>
      </div>
      <EvidenceUpload tenantId={session?.tenantId ?? ""} value={f.evidenceUrls ?? []} onChange={(paths) => setF({ ...f, evidenceUrls: paths })} />
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
      </div>
    </form>
    </div>
  );
}
