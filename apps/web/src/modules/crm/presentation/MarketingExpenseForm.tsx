import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
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
  const field = "h-12 w-full rounded-lg border border-border bg-background px-3 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <ScreenModal onClose={onCancel}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="font-display text-xl font-bold text-foreground">{t("registerExpense")}</h2>
        <button type="button" onClick={onCancel} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CategoryPicker kind="channel" byLabel value={f.channel} onChange={(v) => setF({ ...f, channel: v })} label="channel" />
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
      <div className="mt-auto flex gap-2">
        <button type="submit" className="min-h-[48px] flex-1 rounded-lg bg-primary text-primary-foreground px-4 font-body font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="min-h-[48px] rounded-lg bg-secondary text-foreground px-4 font-body">{t("cancel")}</button>
      </div>
    </form>
    </ScreenModal>
  );
}
