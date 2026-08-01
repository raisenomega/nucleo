import { useEffect, useState } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useBrand } from "@shared/providers/BrandProvider";
import { useSession } from "@shared/providers/SessionProvider";
import { supabase } from "@shared/lib/supabase";
import { useDeliveryNotes } from "@sales/application/useDeliveryNotes.hook";
import { supabaseDeliveryNoteRepository } from "@sales/infrastructure/supabase-delivery-note.repository";
import { DeliveryNotesTable } from "@sales/presentation/DeliveryNotesTable";
import { DeliveryNoteDetail } from "@sales/presentation/DeliveryNoteDetail";
import { DispatchConfirmModal } from "@sales/presentation/DispatchConfirmModal";
import { DeliverModal } from "@sales/presentation/DeliverModal";
import { useDeliveryShare } from "@sales/presentation/useDeliveryShare";
import type { DeliveryNote } from "@sales/domain/delivery-note.types";

export const Route = createFileRoute("/_authenticated/delivery-notes")({ component: DeliveryNotesPage });

function DeliveryNotesPage() {
  const { t } = useI18n(); const { can } = useModuleAccess(); const brand = useBrand(); const { session } = useSession(); const navigate = useNavigate();
  const m = useDeliveryNotes(supabaseDeliveryNoteRepository);
  const [warehouses, setWarehouses] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<DeliveryNote | null>(null);
  const [dispatching, setDispatching] = useState<DeliveryNote | null>(null); const [delivering, setDelivering] = useState<DeliveryNote | null>(null);
  useEffect(() => { void supabase.from("warehouses").select("id,name").eq("tenant_id", session?.tenantId ?? "")
    .then(({ data }) => setWarehouses(Object.fromEntries(((data as { id: string; name: string }[] | null) ?? []).map((w) => [w.id, w.name])))); }, [session?.tenantId]);
  const { download, share } = useDeliveryShare(warehouses);
  if (!can("sales", "view") || !brand.fulfillmentEnabled) return <Navigate to="/dashboard" />;
  const view = viewing ? m.list.find((d) => d.id === viewing.id) ?? viewing : null;
  const onInvoice = (d: DeliveryNote) => void m.invoice(d.id).then((r) => { if (r.ok) void navigate({ to: "/billing" }); else window.alert(r.error); });
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("deliveryNotes")}</h1>
        <p className="text-xs text-muted-foreground">{t("deliveryNotesSubtitle")}</p>
      </div>
      <DeliveryNotesTable rows={m.list} onView={setViewing} />
      {view && <DeliveryNoteDetail note={view} canManage={can("sales", "edit")} warehouses={warehouses}
        onDispatch={() => setDispatching(view)} onDeliver={() => setDelivering(view)}
        onCancel={() => void m.cancel(view.id, "").then(() => setViewing(null))}
        onInvoice={() => onInvoice(view)} onPdf={() => download(view)} onShare={() => share(view)} onClose={() => setViewing(null)} />}
      {dispatching && <DispatchConfirmModal note={dispatching} onClose={() => setDispatching(null)}
        onConfirm={async () => { const r = await m.dispatch(dispatching.id); if (!r.ok) window.alert(r.error); setDispatching(null); }} />}
      {delivering && <DeliverModal noteId={delivering.id} noteNumber={delivering.noteNumber} onClose={() => setDelivering(null)}
        onDeliver={async (d) => { const r = await m.deliver(delivering.id, d); if (!r.ok) window.alert(r.error); setDelivering(null); }} />}
    </div>
  );
}
