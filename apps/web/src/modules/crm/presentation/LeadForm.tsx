import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import { STATUSES, TEMPS } from "@crm/presentation/lead.constants";
import type { LeadFormData } from "@crm/domain/lead.types";

const EMPTY: LeadFormData = {
  contactName: "", phone: "", email: "", serviceRequested: "", leadSource: "",
  temperature: "hot", status: "new", callDate: "", notes: "", evidenceUrls: [],
};

export function LeadForm({ initial, onSubmit, onCancel }: {
  initial?: LeadFormData; onSubmit: (d: LeadFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const [f, setF] = useState<LeadFormData>(initial ?? EMPTY);
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  const txt = (k: "contactName" | "phone" | "email" | "serviceRequested" | "leadSource", type = "text") => (
    <label className="space-y-1"><span className={lbl}>{t(k)}</span>
      <input type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={field} /></label>
  );
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold">{t("newLead")}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {txt("contactName")}{txt("phone", "tel")}{txt("email", "email")}
        {txt("serviceRequested")}{txt("leadSource")}
        <label className="space-y-1"><span className={lbl}>{t("callDate")}</span>
          <input type="date" value={f.callDate} onChange={(e) => setF({ ...f, callDate: e.target.value })} className={field} /></label>
        <label className="space-y-1"><span className={lbl}>{t("temperature")}</span>
          <select value={f.temperature} onChange={(e) => setF({ ...f, temperature: e.target.value })} className={field}>
            {TEMPS.map((x) => <option key={x.value} value={x.value}>{t(x.key)}</option>)}
          </select></label>
        <label className="space-y-1"><span className={lbl}>{t("status")}</span>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={field}>
            {STATUSES.map((x) => <option key={x.value} value={x.value}>{t(x.key)}</option>)}
          </select></label>
        <label className="space-y-1 md:col-span-3"><span className={lbl}>{t("callNotes")}</span>
          <input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={field} /></label>
      </div>
      <EvidenceUpload tenantId={session?.tenantId ?? ""} value={f.evidenceUrls ?? []}
        onChange={(paths) => setF({ ...f, evidenceUrls: paths })} />
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
      </div>
    </form>
  );
}
