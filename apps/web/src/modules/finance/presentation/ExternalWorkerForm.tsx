import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import type { ExternalWorkerFormData, ExternalWorkerType } from "@finance/domain/external-worker.types";

export const EXTERNAL_TYPE_LABEL: Record<ExternalWorkerType, TranslationKey> = {
  contractor: "contractor", helper: "workerHelper", speaker: "workerSpeaker",
  consultant: "workerConsultant", technician: "workerTechnician", freelancer: "workerFreelancer",
};
const TYPES = Object.entries(EXTERNAL_TYPE_LABEL) as [ExternalWorkerType, TranslationKey][];
const EMPTY: ExternalWorkerFormData = { fullName: "", workerType: "contractor", taxId: "", contact: "", notes: "", active: true };

export function ExternalWorkerForm({ initial, onSubmit, onCancel }: {
  initial?: ExternalWorkerFormData; onSubmit: (d: ExternalWorkerFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<ExternalWorkerFormData>(initial ?? EMPTY);
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  const go = (e: React.FormEvent) => { e.preventDefault(); if (!f.fullName.trim()) return; onSubmit(f); };
  return (
    <form onSubmit={go} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1"><span className={lbl}>{t("name")}</span>
          <input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} className={field} required /></label>
        <label className="space-y-1"><span className={lbl}>{t("workerTypeLabel")}</span>
          <select value={f.workerType} onChange={(e) => setF({ ...f, workerType: e.target.value as ExternalWorkerType })} className={field}>
            {TYPES.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}
          </select></label>
        <label className="space-y-1"><span className={lbl}>{t("taxId")}</span>
          <input value={f.taxId} onChange={(e) => setF({ ...f, taxId: e.target.value })} className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("contactInfo")}</span>
          <input value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} className={field} /></label>
        <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("notes")}</span>
          <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={field} /></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} className="h-4 w-4" /> {t("active")}</label>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
      </div>
    </form>
  );
}
