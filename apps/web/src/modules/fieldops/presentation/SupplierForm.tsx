import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { SupplierFieldsA } from "@fieldops/presentation/SupplierFieldsA";
import { SupplierFieldsB } from "@fieldops/presentation/SupplierFieldsB";
import type { SupplierFormData } from "@fieldops/domain/supplier.types";

const EMPTY: SupplierFormData = { name: "", description: "", companyType: "", primaryCategory: "", secondaryCategories: [], website: "", catalogUrl: "", contactName: "", phone: "", email: "", whatsapp: "", address: "", city: "", state: "", zipCode: "", country: "PR", facebook: "", instagram: "", linkedin: "", taxId: "", taxExempt: false, taxRate: null, currency: "USD", acceptedPayments: [], bankName: "", bankAccount: "", routingNumber: "", paymentTerms: "", creditLimit: null, creditBalance: null, leadTimeDays: null, deliveryMethod: "", minOrderAmount: null, returnPolicy: "", rating: null, notes: "", active: true };

// Modal proveedor ultra completo (7 secciones repartidas en SupplierFieldsA/B). Estado central + save.
export function SupplierForm({ initial, onSubmit, onCancel }: {
  initial?: SupplierFormData; onSubmit: (d: SupplierFormData) => void; onCancel: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<SupplierFormData>(initial ?? EMPTY);
  const set = (p: Partial<SupplierFormData>) => setF((c) => ({ ...c, ...p }));
  const go = (e: React.FormEvent) => { e.preventDefault(); if (!f.name.trim()) return; onSubmit(f); };
  return (
    <ScreenModal onClose={onCancel}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("newSupplier")}</h2>
        <button type="button" onClick={onCancel} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={go} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        <SupplierFieldsA f={f} set={set} />
        <SupplierFieldsB f={f} set={set} />
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
        </div>
      </form>
    </ScreenModal>
  );
}
