import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useBillingPlans } from "@billing/application/useBillingPlans.hook";
import { supabaseBillingRepository } from "@billing/infrastructure/supabase-billing.repository";
import { supabaseInvoiceRepository } from "@billing/infrastructure/supabase-invoice.repository";
import { BillingPlanForm } from "@billing/presentation/BillingPlanForm";
import { BillingPlanTable } from "@billing/presentation/BillingPlanTable";
import type { BillingPlan } from "@billing/domain/billing-plan.types";

export function PlansTab() {
  const { t } = useI18n(); const { can } = useModuleAccess();
  const m = useBillingPlans(supabaseBillingRepository);
  const [creating, setCreating] = useState(false);
  const manage = can("billing", "edit");
  const runCycle = async () => { const n = await m.runCycle(); window.alert(`${n} · ${t("generateInvoices")}`); };
  const genOne = async (p: BillingPlan) => {
    await supabaseInvoiceRepository.save({ customerId: null, clientName: p.clientName, phone: p.phone ?? "", email: p.email ?? "",
      items: [{ description: p.serviceDescription ?? t("serviceDescription"), quantity: 1, unitPrice: p.amount, taxPct: 0, discountPct: 0, lineTotal: p.amount }],
      subtotal: p.amount, tax: 0, total: p.amount, dueDate: null, status: "sent" });
    window.alert(t("invoiceSaved"));
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {can("billing", "create") && <button type="button" onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold"><Plus className="h-4 w-4" /> {t("newPlan")}</button>}
        {manage && <button type="button" onClick={() => void runCycle()}
          className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-bold"><RefreshCw className="h-4 w-4" /> {t("generateInvoices")}</button>}
      </div>
      {creating && <BillingPlanForm onSubmit={m.save} onCancel={() => setCreating(false)} />}
      <BillingPlanTable rows={m.plans} canManage={manage} onStatus={(id, st) => void m.setStatus(id, st)} onGenerate={(p) => void genOne(p)} />
    </div>
  );
}
