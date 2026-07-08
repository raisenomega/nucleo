import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useInvoices } from "@billing/application/useInvoices.hook";
import { supabaseInvoiceRepository } from "@billing/infrastructure/supabase-invoice.repository";
import { InvoiceForm } from "@billing/presentation/InvoiceForm";
import { InvoiceTable } from "@billing/presentation/InvoiceTable";
import { InvoiceDetail } from "@billing/presentation/InvoiceDetail";
import { BillingKpis } from "@billing/presentation/BillingKpis";
import type { Invoice } from "@billing/domain/invoice.types";

export function InvoicesTab() {
  const { t } = useI18n(); const { can } = useModuleAccess();
  const m = useInvoices(supabaseInvoiceRepository);
  const [creating, setCreating] = useState(false); const [viewing, setViewing] = useState<Invoice | null>(null);
  const pay = () => { if (viewing) { void m.confirmPayment(viewing.id); setViewing(null); } };
  const cancel = () => { if (viewing) { void m.setStatus(viewing.id, "cancelled"); setViewing(null); } };
  return (
    <div className="space-y-4">
      <BillingKpis s={m.summary} />
      {can("billing", "create") && <button type="button" onClick={() => setCreating((v) => !v)}
        className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold"><Plus className="h-4 w-4" /> {t("newInvoice")}</button>}
      {creating && <InvoiceForm onSubmit={m.save} onCancel={() => setCreating(false)} />}
      <InvoiceTable rows={m.list} onView={setViewing} />
      {viewing && <InvoiceDetail inv={viewing} canManage={can("billing", "edit")} onPay={pay} onCancel={cancel} onClose={() => setViewing(null)} />}
    </div>
  );
}
