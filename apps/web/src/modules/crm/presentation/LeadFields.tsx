import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { CategoryPicker } from "@shared/components/CategoryPicker";
import { STATUSES, TEMPS } from "@crm/presentation/lead.constants";
import type { LeadFormData } from "@crm/domain/lead.types";

type Cat = { id: string; label: string };
type TextKey = "contactName" | "phone" | "email" | "address" | "city" | "zipCode" | "notes";
type SetFn = <K extends keyof LeadFormData>(k: K, v: LeadFormData[K]) => void;

export function LeadFields({ f, set, sources, services }: {
  f: LeadFormData; set: SetFn; sources: Cat[]; services: Cat[];
}) {
  const { t } = useI18n();
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  const txt = (k: TextKey, lk: TranslationKey, type = "text") => (
    <label className="space-y-1"><span className={lbl}>{t(lk)}</span>
      <input type={type} value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={field} /></label>
  );
  const drop = (value: string, k: "leadSourceId" | "serviceTypeId", lk: TranslationKey, opts: Cat[]) => (
    <label className="space-y-1"><span className={lbl}>{t(lk)}</span>
      <select value={value} onChange={(e) => set(k, e.target.value)} className={field}>
        <option value="">—</option>{opts.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select></label>
  );
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {txt("contactName", "contactName")}{txt("phone", "phone", "tel")}{txt("email", "email", "email")}
      {txt("address", "address")}{txt("city", "city")}{txt("zipCode", "zip")}
      <CategoryPicker kind="lead_source" gateModule="leads" value={f.leadSourceId ?? ""} onChange={(id) => set("leadSourceId", id)} label="leadSource" />
      <CategoryPicker kind="service_type" gateModule="leads" value={f.serviceTypeId ?? ""} onChange={(id) => set("serviceTypeId", id)} label="serviceRequested" />
      <label className="space-y-1"><span className={lbl}>{t("temperature")}</span>
        <select value={f.temperature} onChange={(e) => set("temperature", e.target.value)} className={field}>
          {TEMPS.map((x) => <option key={x.value} value={x.value}>{t(x.key)}</option>)}
        </select></label>
      <label className="space-y-1"><span className={lbl}>{t("status")}</span>
        <select value={f.status} onChange={(e) => set("status", e.target.value)} className={field}>
          {STATUSES.map((x) => <option key={x.value} value={x.value}>{t(x.key)}</option>)}
        </select></label>
      <label className="space-y-1"><span className={lbl}>{t("callDate")}</span>
        <input type="date" value={f.callDate} onChange={(e) => set("callDate", e.target.value)} className={field} /></label>
      <label className="space-y-1 md:col-span-3"><span className={lbl}>{t("callNotes")}</span>
        <input value={f.notes} onChange={(e) => set("notes", e.target.value)} className={field} /></label>
    </div>
  );
}
