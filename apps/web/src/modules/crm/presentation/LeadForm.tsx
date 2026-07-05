import { useState } from "react";
import { FileText, MessageCircle, Receipt } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { LeadFields } from "@crm/presentation/LeadFields";
import { LeadItemsEditor } from "@crm/presentation/LeadItemsEditor";
import type { LeadFormData, LeadItem } from "@crm/domain/lead.types";

type Cat = { id: string; label: string };
const EMPTY: LeadFormData = {
  contactName: "", phone: "", email: "", address: "", city: "", zipCode: "",
  leadSourceId: "", serviceTypeId: "", temperature: "hot", status: "new",
  callDate: "", notes: "", quotedPrice: 0, items: [],
};

export function LeadForm({ sources, services, initial, onSubmit, onCancel }: {
  sources: Cat[]; services: Cat[]; initial?: LeadFormData;
  onSubmit: (d: LeadFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<LeadFormData>(initial ?? EMPTY);
  function set<K extends keyof LeadFormData>(k: K, v: LeadFormData[K]) { setF((p) => ({ ...p, [k]: v })); }
  const items = f.items ?? [];
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const ready = Boolean(f.contactName && f.phone);
  const wa = () => window.open(`https://wa.me/${f.phone.replace(/\D/g, "")}?text=${encodeURIComponent(t("whatsappMessage", { name: f.contactName, total: formatCurrency(total) }))}`, "_blank");
  const act = "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-body font-bold";
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...f, quotedPrice: total }); }}
      className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold">{t("newLead")}</h2>
      <LeadFields f={f} set={set} sources={sources} services={services} />
      <LeadItemsEditor items={items} onChange={(it: LeadItem[]) => set("items", it)} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
        </div>
        {ready && (
          <div className="flex gap-2">
            <button type="button" onClick={wa} className={`${act} bg-green-600 text-white`}><MessageCircle className="h-4 w-4" /> {t("whatsapp")}</button>
            <button type="button" onClick={() => window.alert(t("quotePlaceholder"))} className={`${act} bg-secondary text-foreground`}><FileText className="h-4 w-4" /> {t("quote")}</button>
            <button type="button" onClick={() => window.alert(t("invoicePlaceholder"))} className={`${act} bg-secondary text-foreground`}><Receipt className="h-4 w-4" /> {t("invoice")}</button>
          </div>
        )}
      </div>
    </form>
  );
}
