import { useState } from "react";
import { Check, MessageCircle, UserCheck, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { CustomerSelect, type PickedCustomer } from "@shared/customers/CustomerSelect";
import { LeadFields } from "@crm/presentation/LeadFields";
import { LeadItemsEditor } from "@crm/presentation/LeadItemsEditor";
import type { LeadFormData, LeadItem } from "@crm/domain/lead.types";

type Cat = { id: string; label: string };
const EMPTY: LeadFormData = {
  contactName: "", phone: "", email: "", address: "", city: "", zipCode: "",
  leadSourceId: "", serviceTypeId: "", temperature: "hot", status: "new",
  callDate: "", notes: "", quotedPrice: 0, items: [],
};

export function LeadForm({ sources, services, initial, onSubmit, onCancel, canSubmit }: {
  sources: Cat[]; services: Cat[]; initial?: LeadFormData;
  onSubmit: (d: LeadFormData) => void; onCancel: () => void; canSubmit: boolean;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<LeadFormData>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  function set<K extends keyof LeadFormData>(k: K, v: LeadFormData[K]) { setF((p) => ({ ...p, [k]: v })); }
  const pick = (c: PickedCustomer) => setF((p) => ({ ...p, customerId: c.id, contactName: c.name || p.contactName, phone: c.phone || p.phone, email: c.email || p.email }));
  const items = f.items ?? [];
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  // Cada acción PRIMERO guarda (onSubmit) y DESPUÉS ejecuta su efecto (mismo tick → sin bloqueo de popup).
  function act(after: () => void) {
    if (!f.contactName || !f.phone) { setError(t("requiredFields")); return; }
    onSubmit({ ...f, quotedPrice: total });
    after();
  }
  const wa = () => window.open(`https://wa.me/${f.phone.replace(/\D/g, "")}?text=${encodeURIComponent(t("whatsappMessage", { name: f.contactName, total: formatCurrency(total) }))}`, "_blank");
  const b = "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-body font-bold";
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold">{t("newLead")}</h2>
      <CustomerSelect onPick={pick} />
      {f.customerId && <p className="flex items-center gap-1 text-xs font-bold text-green-600"><UserCheck className="h-3.5 w-3.5" />Cliente vinculado
        <button type="button" onClick={() => set("customerId", null)} className="inline-flex text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button></p>}
      <LeadFields f={f} set={set} sources={sources} services={services} />
      <LeadItemsEditor items={items} onChange={(it: LeadItem[]) => set("items", it)} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {canSubmit && <button type="button" onClick={() => act(() => undefined)} className={`${b} bg-primary text-primary-foreground`}><Check className="h-4 w-4" /> {t("save")}</button>}
          {canSubmit && <button type="button" onClick={() => act(wa)} className={`${b} bg-green-600 text-white`}><MessageCircle className="h-4 w-4" /> {t("whatsapp")}</button>}
        </div>
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm font-body text-muted-foreground hover:underline">{t("cancel")}</button>
      </div>
    </div>
  );
}
