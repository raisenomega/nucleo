import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { SupplierFormData } from "@fieldops/domain/supplier.types";

type StrKey = "name" | "contactName" | "phone" | "email" | "address" | "paymentTerms";
const EMPTY: SupplierFormData = { name: "", contactName: "", phone: "", email: "", address: "", leadTimeDays: null, paymentTerms: "", notes: "", active: true };

export function SupplierForm({ initial, onSubmit, onCancel }: {
  initial?: SupplierFormData; onSubmit: (d: SupplierFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<SupplierFormData>(initial ?? EMPTY);
  const set = (p: Partial<SupplierFormData>) => setF((c) => ({ ...c, ...p }));
  const fld = "w-full rounded-lg border border-border bg-background p-2 font-body text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  const txt = (k: StrKey, key: TranslationKey, type = "text", req = false) => (
    <label className="space-y-1"><span className={lbl}>{t(key)}</span>
      <input type={type} value={f[k]} onChange={(e) => set({ [k]: e.target.value } as Partial<SupplierFormData>)} className={fld} required={req} /></label>
  );
  const go = (e: React.FormEvent) => { e.preventDefault(); if (!f.name.trim()) return; onSubmit(f); };
  return (
    <ScreenModal onClose={onCancel}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("newSupplier")}</h2>
        <button type="button" onClick={onCancel} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={go} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        {txt("name", "name", "text", true)}{txt("contactName", "contactName")}{txt("phone", "phone", "tel")}{txt("email", "email", "email")}{txt("address", "address")}
        <label className="space-y-1"><span className={lbl}>{t("leadTime")}</span>
          <input type="number" min="0" value={f.leadTimeDays ?? ""} onChange={(e) => set({ leadTimeDays: e.target.value ? Number(e.target.value) : null })} className={fld} /></label>
        {txt("paymentTerms", "paymentTerms")}
        <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("notes")}</span>
          <input value={f.notes} onChange={(e) => set({ notes: e.target.value })} className={fld} /></label>
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={f.active} onChange={(e) => set({ active: e.target.checked })} className="h-4 w-4" /> {t("active")}</label>
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
        </div>
      </form>
    </ScreenModal>
  );
}
