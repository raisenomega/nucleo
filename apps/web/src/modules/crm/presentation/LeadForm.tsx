import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import { LeadFields } from "@crm/presentation/LeadFields";
import { LeadItemsEditor } from "@crm/presentation/LeadItemsEditor";
import type { LeadFormData, LeadItem } from "@crm/domain/lead.types";

type Cat = { id: string; label: string };
const EMPTY: LeadFormData = {
  contactName: "", phone: "", email: "", address: "", city: "", zipCode: "",
  leadSourceId: "", serviceTypeId: "", temperature: "hot", status: "new",
  callDate: "", notes: "", quotedPrice: 0, items: [], evidenceUrls: [],
};

export function LeadForm({ sources, services, initial, onSubmit, onCancel }: {
  sources: Cat[]; services: Cat[]; initial?: LeadFormData;
  onSubmit: (d: LeadFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const { session } = useSession();
  const [f, setF] = useState<LeadFormData>(initial ?? EMPTY);
  function set<K extends keyof LeadFormData>(k: K, v: LeadFormData[K]) { setF((p) => ({ ...p, [k]: v })); }
  const items = f.items ?? [];
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, quotedPrice: total }); }}
      className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold">{t("newLead")}</h2>
      <LeadFields f={f} set={set} sources={sources} services={services} />
      <LeadItemsEditor items={items} onChange={(it: LeadItem[]) => set("items", it)} />
      <EvidenceUpload tenantId={session?.tenantId ?? ""} value={f.evidenceUrls ?? []}
        onChange={(paths) => set("evidenceUrls", paths)} />
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
      </div>
    </form>
  );
}
