import { useState } from "react";
import { UserCheck, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { CustomerSelect, type PickedCustomer } from "@shared/customers/CustomerSelect";
import { SalesOrderItemsEditor } from "@sales/presentation/SalesOrderItemsEditor";
import type { PickedItem } from "@shared/components/InventoryItemSelect";
import type { SoInput, SoLineInput, SoResult } from "@sales/domain/sales-order.types";

const NEW: SoLineInput = { description: "", qty: 1, unitPrice: 0, discountPct: 0, taxPct: 0 };

export function SalesOrderForm({ onSubmit, onCancel }: { onSubmit: (d: SoInput) => Promise<SoResult>; onCancel: () => void }) {
  const { t } = useI18n();
  const [customerId, setCustomerId] = useState<string | null>(null); const [customerName, setCustomerName] = useState("");
  const [terms, setTerms] = useState(""); const [deliveryDate, setDeliveryDate] = useState("");
  const [items, setItems] = useState<SoLineInput[]>([NEW]); const [atp, setAtp] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState(""); const [busy, setBusy] = useState(false);
  const pick = (c: PickedCustomer) => { setCustomerId(c.id); setCustomerName(c.name); if (c.paymentTerms) setTerms(c.paymentTerms); };
  const addItem = (p: PickedItem) => { setAtp((a) => ({ ...a, [p.itemId]: p.stock - p.reserved })); setItems((it) => [...it, { description: p.name, qty: 1, unitPrice: p.unitCost, discountPct: 0, taxPct: 0, itemId: p.itemId }]); };
  const total = items.reduce((s, i) => s + i.qty * i.unitPrice * (1 - i.discountPct / 100) * (1 + i.taxPct / 100), 0);
  async function submit() {
    if (!customerId) { window.alert(t("customerRequired")); return; } setBusy(true);
    const r = await onSubmit({ customerId, deliveryDate: deliveryDate || null, shippingAddressId: null, paymentTerms: terms || null, notesInternal: "", notesCustomer: notes, items });
    setBusy(false); if (!r.ok) window.alert(r.error); else onCancel();
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-3 rounded-lg border border-border bg-card p-5">
      <CustomerSelect onPick={pick} />
      {customerId && <p className="flex items-center gap-2 text-xs font-bold text-green-600"><UserCheck className="h-3.5 w-3.5" />{customerName}
        <button type="button" onClick={() => setCustomerId(null)} className="inline-flex items-center gap-0.5 text-muted-foreground"><X className="h-3 w-3" />{t("cancel")}</button></p>}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("deliveryDate")}</span>
          <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className={fld} /></label>
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("paymentTerms")}</span>
          <input value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="net_15" className={fld} /></label>
      </div>
      <SalesOrderItemsEditor items={items} atp={atp} onChange={setItems} onAddItem={addItem} />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notesCustomer")} className={fld} rows={2} />
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground">{t("total")}: {total.toFixed(2)}</span>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("createSalesOrder")}</button>
          <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
        </div>
      </div>
    </form>
  );
}
