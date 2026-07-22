import { useState } from "react";
import { UserCheck, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { CustomerSelect, type PickedCustomer } from "@shared/customers/CustomerSelect";
import { InvoiceItemsEditor } from "@billing/presentation/InvoiceItemsEditor";
import type { InvoiceInput, InvoiceItem, InvoiceStatus, BillingResult } from "@billing/domain/invoice.types";

const NEW: InvoiceItem = { description: "", quantity: 1, unitPrice: 0, taxPct: 0, discountPct: 0, lineTotal: 0 };
const TERMS_DAYS: Record<string, number> = { immediate: 0, net_15: 15, net_30: 30, net_60: 60, net_90: 90 };
const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

export function InvoiceForm({ onSubmit, onCancel }: {
  onSubmit: (d: InvoiceInput) => Promise<BillingResult>; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState(""); const [email, setEmail] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([NEW]);
  const [dueDate, setDueDate] = useState(""); const [busy, setBusy] = useState(false);
  const pick = (c: PickedCustomer) => {
    setCustomerId(c.id); setClientName(c.name); setPhone(c.phone); setEmail(c.email);
    setDueDate(addDays(c.paymentTerms === "custom" ? (c.paymentTermsCustomDays ?? 0) : (TERMS_DAYS[c.paymentTerms] ?? 0)));
  };
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - i.discountPct / 100), 0);
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  async function submit(status: InvoiceStatus) {
    if (!clientName.trim()) return; setBusy(true);
    const r = await onSubmit({ customerId, clientName: clientName.trim(), phone, email, items, subtotal, tax: total - subtotal, total, dueDate: dueDate || null, status });
    setBusy(false); if (!r.ok) window.alert(r.error); else onCancel();
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit("sent"); }} className="space-y-3 rounded-lg border border-border bg-card p-5">
      <CustomerSelect onPick={pick} />
      {customerId && <p className="flex items-center gap-2 text-xs font-bold text-green-600"><UserCheck className="h-3.5 w-3.5" />Cliente vinculado · vencimiento auto
        <button type="button" onClick={() => setCustomerId(null)} className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"><X className="h-3 w-3" />desvincular</button></p>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t("clientName")} className={fld} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("phone")} className={fld} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("email")} className={fld} />
      </div>
      <InvoiceItemsEditor items={items} onChange={setItems} />
      <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("dueDate")}</span>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fld} /></label>
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => void submit("draft")} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold disabled:opacity-50">{t("saveDraft")}</button>
        <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("send")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
