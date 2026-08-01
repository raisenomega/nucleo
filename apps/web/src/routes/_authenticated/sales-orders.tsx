import { useState } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useBrand } from "@shared/providers/BrandProvider";
import { useSalesOrders } from "@sales/application/useSalesOrders.hook";
import { supabaseSalesOrderRepository } from "@sales/infrastructure/supabase-sales-order.repository";
import { supabaseDeliveryNoteRepository } from "@sales/infrastructure/supabase-delivery-note.repository";
import { SalesOrderForm } from "@sales/presentation/SalesOrderForm";
import { SalesOrderTable } from "@sales/presentation/SalesOrderTable";
import { SalesOrderDetail } from "@sales/presentation/SalesOrderDetail";
import { SalesOrderKpis } from "@sales/presentation/SalesOrderKpis";
import { BackorderModal } from "@sales/presentation/BackorderModal";
import { CreateDeliveryNoteModal } from "@sales/presentation/CreateDeliveryNoteModal";
import type { SalesOrder, Backorder } from "@sales/domain/sales-order.types";

export const Route = createFileRoute("/_authenticated/sales-orders")({ component: SalesOrdersPage });

function SalesOrdersPage() {
  const { t } = useI18n(); const { can } = useModuleAccess(); const brand = useBrand(); const navigate = useNavigate();
  const m = useSalesOrders(supabaseSalesOrderRepository);
  const [creating, setCreating] = useState(false); const [viewing, setViewing] = useState<SalesOrder | null>(null);
  const [backorder, setBackorder] = useState<Backorder[] | null>(null); const [delivering, setDelivering] = useState<SalesOrder | null>(null);
  if (!can("sales", "view") || !brand.fulfillmentEnabled) return <Navigate to="/dashboard" />;
  const view = viewing ? m.list.find((o) => o.id === viewing.id) ?? viewing : null;
  const onConfirm = () => { if (view) void m.confirm(view.id).then((r) => { if (r.backordered_items.length) setBackorder(r.backordered_items); }); };
  const onInvoice = () => { if (view) void m.invoice(view.id).then((r) => window.alert(r.ok ? t("invoiceSaved") : r.error)); };
  const onCancel = () => { if (view && window.confirm(`${t("cancelOrder")}?`)) void m.cancel(view.id, "").then(() => setViewing(null)); };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("salesOrders")}</h1>
          {can("sales", "create") && <button type="button" onClick={() => setCreating((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold"><Plus className="h-4 w-4" /> {t("createSalesOrder")}</button>}
        </div>
        <p className="text-xs text-muted-foreground">{t("salesSubtitle")}</p>
      </div>
      <SalesOrderKpis rows={m.list} />
      {creating && <SalesOrderForm onSubmit={m.create} onCancel={() => setCreating(false)} />}
      <SalesOrderTable rows={m.list} onView={setViewing} />
      {view && <SalesOrderDetail order={view} canManage={can("sales", "edit")} onConfirm={onConfirm} onCreateDelivery={() => setDelivering(view)} onInvoice={onInvoice} onCancel={onCancel} onClose={() => setViewing(null)} />}
      {backorder && <BackorderModal items={backorder} onClose={() => setBackorder(null)} />}
      {delivering && <CreateDeliveryNoteModal order={delivering} onClose={() => setDelivering(null)}
        onCreate={async (d) => { const r = await supabaseDeliveryNoteRepository.create(d); if (r.ok) { setDelivering(null); void navigate({ to: "/delivery-notes" }); } return r; }} />}
    </div>
  );
}
