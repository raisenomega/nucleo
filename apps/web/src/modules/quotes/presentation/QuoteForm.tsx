import { useState } from "react";
import { UserCheck, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { CustomerSelect, type PickedCustomer } from "@shared/customers/CustomerSelect";
import { QuoteItemsEditor } from "@quotes/presentation/QuoteItemsEditor";
import type { Quote, QuoteInput, QuoteItem, QuoteStatus, QuoteResult } from "@quotes/domain/quote.types";

const NEW: QuoteItem = { description: "", quantity: 1, unitPrice: 0, taxPct: 0, discountPct: 0, lineTotal: 0 };

// initial => modo edición (precarga + un solo botón "Guardar cambios"; el status lo preserva el repo).
export function QuoteForm({ initial, onSubmit, onCancel }: {
  initial?: Quote; onSubmit: (d: QuoteInput) => Promise<QuoteResult>; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [clientName, setClientName] = useState(initial?.clientName ?? ""); const [clientPhone, setClientPhone] = useState(initial?.clientPhone ?? "");
  const [clientEmail, setClientEmail] = useState(initial?.clientEmail ?? ""); const [clientAddress, setClientAddress] = useState(initial?.clientAddress ?? "");
  const [customerId, setCustomerId] = useState<string | null>(initial?.customerId ?? null);
  const pick = (c: PickedCustomer) => { setCustomerId(c.id); setClientName(c.name); setClientPhone(c.phone); setClientEmail(c.email); setClientAddress(c.address); };
  const [items, setItems] = useState<QuoteItem[]>(initial ? [...initial.items] : [NEW]);
  const [notes, setNotes] = useState(initial?.notes ?? ""); const [terms, setTerms] = useState(initial?.terms ?? "");
  const [validUntil, setValidUntil] = useState(initial?.validUntil ?? ""); const [busy, setBusy] = useState(false);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - i.discountPct / 100), 0);
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  async function submit(status: QuoteStatus) {
    if (!clientName.trim()) return; setBusy(true);
    const r = await onSubmit({ customerId, clientName: clientName.trim(), clientPhone, clientEmail, clientAddress, items,
      subtotal, taxTotal: total - subtotal, total, validUntil: validUntil || null, notes, terms, status });
    setBusy(false); if (!r.ok) window.alert(r.error); else onCancel();
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit("sent"); }} className="space-y-3 rounded-lg border border-border bg-card p-5">
      <CustomerSelect onPick={pick} />
      {customerId && <p className="flex items-center gap-2 text-xs font-bold text-green-600"><UserCheck className="h-3.5 w-3.5" />Cliente del maestro vinculado
        <button type="button" onClick={() => setCustomerId(null)} className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"><X className="h-3 w-3" />desvincular</button></p>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input required value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={t("clientName")} className={fld} />
        <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder={t("phone")} className={fld} />
        <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder={t("email")} className={fld} />
        <input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder={t("address")} className={fld} />
      </div>
      <QuoteItemsEditor items={items} onChange={setItems} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notes")} className={fld} rows={2} />
      <textarea value={terms} onChange={(e) => setTerms(e.target.value)} placeholder={t("terms")} className={fld} rows={2} />
      <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("validUntil")}</span>
        <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={fld} /></label>
      <div className="flex gap-2">
        {initial
          ? <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("saveChanges")}</button>
          : <>
              <button type="button" disabled={busy} onClick={() => void submit("draft")} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold disabled:opacity-50">{t("saveDraft")}</button>
              <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("send")}</button>
            </>}
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
