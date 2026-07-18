import { Star } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { SupplierFormData } from "@fieldops/domain/supplier.types";

const PAYS = ["Efectivo", "Cheque", "Transferencia", "ATH Móvil", "Tarjeta", "Crédito"];
const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
const lbl = "text-xs font-bold text-muted-foreground";
const sec = "col-span-full border-t border-border pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground";
type NumKey = "taxRate" | "creditLimit" | "creditBalance" | "leadTimeDays" | "minOrderAmount";

// Secciones 4-7 del proveedor: fiscal, pago, logística, evaluación.
export function SupplierFieldsB({ f, set }: { f: SupplierFormData; set: (p: Partial<SupplierFormData>) => void }) {
  const { t } = useI18n();
  const txt = (k: keyof SupplierFormData, label: string) => (
    <label className="space-y-1"><span className={lbl}>{label}</span>
      <input value={(f[k] as string) ?? ""} onChange={(e) => set({ [k]: e.target.value } as Partial<SupplierFormData>)} className={fld} /></label>
  );
  const num = (k: NumKey, label: string) => (
    <label className="space-y-1"><span className={lbl}>{label}</span>
      <input type="number" min="0" step="0.01" value={f[k] ?? ""} onChange={(e) => set({ [k]: e.target.value ? Number(e.target.value) : null })} className={fld} /></label>
  );
  const togglePay = (p: string) => set({ acceptedPayments: f.acceptedPayments.includes(p) ? f.acceptedPayments.filter((x) => x !== p) : [...f.acceptedPayments, p] });
  return (
    <>
      <p className={sec}>{t("secFiscal")}</p>
      {txt("taxId", t("taxId"))}{num("taxRate", t("taxRate"))}{txt("currency", t("currency"))}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.taxExempt} onChange={(e) => set({ taxExempt: e.target.checked })} className="h-4 w-4" /> {t("taxExempt")}</label>
      <p className={sec}>{t("paymentInfo")}</p>
      <div className="col-span-full flex flex-wrap gap-3">{PAYS.map((p) => <label key={p} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={f.acceptedPayments.includes(p)} onChange={() => togglePay(p)} className="h-4 w-4" /> {p}</label>)}</div>
      {txt("bankName", t("bankName"))}{txt("bankAccount", t("bankAccount"))}{txt("routingNumber", t("routingNumber"))}{txt("paymentTerms", t("paymentTerms"))}
      {num("creditLimit", t("creditLimit"))}{num("creditBalance", t("creditBalance"))}
      <p className={sec}>{t("secLogistics")}</p>
      {num("leadTimeDays", t("leadTime"))}{txt("deliveryMethod", t("deliveryMethod"))}{num("minOrderAmount", t("minOrder"))}
      <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("returnPolicy")}</span><textarea value={f.returnPolicy} onChange={(e) => set({ returnPolicy: e.target.value })} rows={2} className={fld} /></label>
      <p className={sec}>{t("secEval")}</p>
      <label className="space-y-1"><span className={lbl}>{t("rating")}</span>
        <div className="flex gap-1">{[1, 2, 3, 4, 5].map((r) => <button key={r} type="button" onClick={() => set({ rating: r })} aria-label={String(r)}><Star className={`h-5 w-5 ${(f.rating ?? 0) >= r ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} /></button>)}</div></label>
      <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("notes")}</span><textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} className={fld} /></label>
      <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} className="h-4 w-4" /> {t("active")}</label>
    </>
  );
}
