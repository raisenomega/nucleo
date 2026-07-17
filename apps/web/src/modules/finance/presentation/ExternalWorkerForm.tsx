import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import type { ExternalWorkerFormData, ExternalWorkerType, PaymentPreference } from "@finance/domain/external-worker.types";

export const EXTERNAL_TYPE_LABEL: Record<ExternalWorkerType, TranslationKey> = {
  contractor: "contractor", helper: "workerHelper", speaker: "workerSpeaker",
  consultant: "workerConsultant", technician: "workerTechnician", freelancer: "workerFreelancer",
};
const TYPES = Object.entries(EXTERNAL_TYPE_LABEL) as [ExternalWorkerType, TranslationKey][];
const PAYS: [PaymentPreference, TranslationKey][] = [["efectivo", "payEfectivo"], ["ath_movil", "payAthMovil"], ["transferencia", "payTransferencia"], ["cheque", "payCheque"]];
type StrKey = "phone" | "email" | "address" | "specialty" | "department" | "taxId" | "bankAccount";
const EMPTY: ExternalWorkerFormData = { fullName: "", workerType: "contractor", phone: "", email: "", address: "", specialty: "", department: "", taxId: "", hourlyRate: null, dailyRate: null, paymentPreference: "efectivo", bankAccount: "", notes: "", active: true };

export function ExternalWorkerForm({ initial, onSubmit, onCancel }: {
  initial?: ExternalWorkerFormData; onSubmit: (d: ExternalWorkerFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<ExternalWorkerFormData>(initial ?? EMPTY);
  const set = (p: Partial<ExternalWorkerFormData>) => setF((c) => ({ ...c, ...p }));
  const fld = "w-full rounded-lg border border-border bg-background p-2 font-body text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  const sec = "col-span-full border-t border-border pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground";
  const txt = (k: StrKey, key: TranslationKey, type = "text") => (
    <label className="space-y-1"><span className={lbl}>{t(key)}</span>
      <input type={type} value={f[k]} onChange={(e) => set({ [k]: e.target.value } as Partial<ExternalWorkerFormData>)} className={fld} /></label>
  );
  const rate = (k: "hourlyRate" | "dailyRate", key: TranslationKey) => (
    <label className="space-y-1"><span className={lbl}>{t(key)}</span>
      <input type="number" step="0.01" min="0" value={f[k] ?? ""} onChange={(e) => set({ [k]: e.target.value ? Number(e.target.value) : null })} className={fld} /></label>
  );
  const go = (e: React.FormEvent) => { e.preventDefault(); if (!f.fullName.trim()) return; onSubmit(f); };
  return (
    <form onSubmit={go} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <p className={sec}>{t("personalInfo")}</p>
        <label className="space-y-1"><span className={lbl}>{t("name")}</span>
          <input value={f.fullName} onChange={(e) => set({ fullName: e.target.value })} className={fld} required /></label>
        <label className="space-y-1"><span className={lbl}>{t("workerTypeLabel")}</span>
          <select value={f.workerType} onChange={(e) => set({ workerType: e.target.value as ExternalWorkerType })} className={fld}>{TYPES.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}</select></label>
        {txt("phone", "phone", "tel")}{txt("email", "email", "email")}{txt("address", "address")}
        <p className={sec}>{t("professionalInfo")}</p>
        {txt("specialty", "specialty")}{txt("department", "department")}{txt("taxId", "taxId")}
        <p className={sec}>{t("paymentInfo")}</p>
        {rate("hourlyRate", "hourlyRate")}{rate("dailyRate", "dailyRate")}
        <label className="space-y-1"><span className={lbl}>{t("paymentPreference")}</span>
          <select value={f.paymentPreference} onChange={(e) => set({ paymentPreference: e.target.value as PaymentPreference })} className={fld}>{PAYS.map(([v, k]) => <option key={v} value={v}>{t(k)}</option>)}</select></label>
        {txt("bankAccount", "bankAccount")}
        <p className={sec}>{t("notes")}</p>
        <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("notes")}</span>
          <textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} className={fld} /></label>
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} className="h-4 w-4" /> {t("active")}</label>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
      </div>
    </form>
  );
}
