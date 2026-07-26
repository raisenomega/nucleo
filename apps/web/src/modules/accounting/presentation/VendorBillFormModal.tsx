import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { z } from "zod";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useToast } from "@shared/providers/toast-context";
import { fetchSuppliers, fetchExpenseCategories, type SupplierRef, type OptionRef } from "@accounting/infrastructure/ap-refs";
import { dueFromTerms } from "@accounting/presentation/vendor-bill-ui";
import type { Result } from "@accounting/domain/chart-of-accounts.types";
import type { BillFormData } from "@accounting/domain/vendor-bill.types";

type Line = { description: string; quantity: string; unitPrice: string; taxPct: string };
const EMPTY: Line = { description: "", quantity: "1", unitPrice: "", taxPct: "0" };
const schema = z.object({ supplierId: z.string().uuid(), billNumber: z.string().min(1), billDate: z.string().min(1), dueDate: z.string().min(1) });

// Alta de bill directo/manual (líneas de gasto). Vencimiento auto según payment_terms del proveedor.
export function VendorBillFormModal({ onCreate, onClose }: { onCreate: (d: BillFormData) => Promise<Result<string, string>>; onClose: () => void }) {
  const { t } = useI18n(); const toast = useToast();
  const [suppliers, setSuppliers] = useState<SupplierRef[]>([]); const [cats, setCats] = useState<OptionRef[]>([]);
  const [supplierId, setSupplierId] = useState(""); const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState(""); const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ ...EMPTY }]);
  useEffect(() => { void fetchSuppliers().then(setSuppliers); void fetchExpenseCategories().then(setCats); }, []);
  const num = (v: string) => Number(v) || 0;
  const upd = (i: number, p: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...p } : l)));
  const pickSupplier = (id: string) => { setSupplierId(id); const s = suppliers.find((x) => x.id === id); if (s) setDueDate(dueFromTerms(billDate, s.paymentTerms)); };
  const total = useMemo(() => lines.reduce((s, l) => s + num(l.quantity) * num(l.unitPrice) * (1 + num(l.taxPct) / 100), 0), [lines]);
  const filled = lines.filter((l) => l.description && num(l.quantity) > 0 && num(l.unitPrice) > 0);
  const valid = schema.safeParse({ supplierId, billNumber, billDate, dueDate }).success && dueDate >= billDate && filled.length > 0;
  async function save() {
    const d: BillFormData = { supplierId, billNumber: billNumber.trim(), billDate, dueDate, notes: notes || null, purchaseOrderId: null,
      lines: filled.map((l) => ({ description: l.description, quantity: num(l.quantity), unitPrice: num(l.unitPrice), taxPct: num(l.taxPct), categoryId: categoryId || undefined })) };
    const r = await onCreate(d);
    if (r.ok) { toast.success(t("saved")); onClose(); } else toast.error(r.error);
  }
  const c = "rounded border border-border bg-background p-1 text-xs"; const f = "w-full rounded border border-border bg-background p-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("createBill")}</h2>
        <select value={supplierId} onChange={(e) => pickSupplier(e.target.value)} className={f}><option value="">{t("selectSupplier")}</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder={t("billNumber")} className={f} />
        <div className="flex gap-2"><input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className={f} /><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={f} /></div>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={f}><option value="">{t("account")}…</option>{cats.map((ct) => <option key={ct.id} value={ct.id}>{ct.label}</option>)}</select>
        <table className="w-full text-xs"><tbody>{lines.map((l, i) => (
          <tr key={i}>
            <td className="pr-1"><input value={l.description} onChange={(e) => upd(i, { description: e.target.value })} placeholder={t("description")} className={`${c} w-full`} /></td>
            <td className="pr-1"><input value={l.quantity} onChange={(e) => upd(i, { quantity: e.target.value })} className={`${c} w-12`} /></td>
            <td className="pr-1"><input value={l.unitPrice} onChange={(e) => upd(i, { unitPrice: e.target.value })} placeholder={t("price")} className={`${c} w-16`} /></td>
            <td className="pr-1"><input value={l.taxPct} onChange={(e) => upd(i, { taxPct: e.target.value })} className={`${c} w-10`} /></td>
            <td>{lines.length > 1 && <button type="button" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}</td>
          </tr>))}</tbody></table>
        <button type="button" onClick={() => setLines((ls) => [...ls, { ...EMPTY }])} className="flex items-center gap-1 text-xs font-bold text-primary"><Plus className="h-3.5 w-3.5" />{t("addLine")}</button>
        <div className="flex justify-between border-t border-border pt-2 text-sm"><span className="text-muted-foreground">{t("total")}</span><span className="font-bold">{formatCurrency(total)}</span></div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancelBtn")}</button>
          <button type="button" disabled={!valid} onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("saveBtn")}</button></div>
      </div>
    </ScreenModal>
  );
}
