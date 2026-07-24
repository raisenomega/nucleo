import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { useInventory } from "@fieldops/application/useInventory.hook";
import { useInventoryCounts } from "@fieldops/application/useInventoryCounts.hook";
import { supabaseInventoryRepository } from "@fieldops/infrastructure/supabase-inventory.repository";
import { supabaseInventoryCountRepository } from "@fieldops/infrastructure/supabase-inventory-count.repository";
import { CountsTable } from "@fieldops/presentation/CountsTable";
import { CreateCountModal } from "@fieldops/presentation/CreateCountModal";
import { CountDetail } from "@fieldops/presentation/CountDetail";
import type { CountFormData } from "@fieldops/domain/inventory-count.types";

export const Route = createFileRoute("/_authenticated/inventory/counts")({ component: CountsPage });

function CountsPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const toast = useToast();
  const inv = useInventory(supabaseInventoryRepository);
  const cc = useInventoryCounts(supabaseInventoryCountRepository);
  const [creating, setCreating] = useState(false);
  async function create(d: CountFormData) { const r = await cc.create(d); if (r.ok) { setCreating(false); await cc.selectCount(r.value); } else toast.error(r.error); }
  async function record(edits: { id: string; qty: number }[]) { for (const e of edits) { const r = await cc.recordLine(e.id, e.qty); if (!r.ok) return toast.error(r.error); } toast.success(t("saved")); }
  async function approve(ids: string[], action: "approve" | "reject") { if (!cc.selected) return; const r = await cc.approveLines(cc.selected.id, ids, action); if (!r.ok) toast.error(r.error); }
  async function apply() { if (!cc.selected) return; const r = await cc.apply(cc.selected.id); if (r.ok) toast.success(t("saved")); else toast.error(r.error); }
  async function cancel(id: string) { if (window.confirm(`${t("cancel")}?`)) { const r = await cc.cancel(id); if (!r.ok) toast.error(r.error); } }
  if (!can("inventory", "view")) return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("cyclicCount")}</h1>
        {can("inventory", "edit") && <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold"><Plus className="h-4 w-4" /> {t("createCount")}</button>}
      </div>
      <CountsTable counts={cc.counts} onOpen={(id) => void cc.selectCount(id)} onCancel={cancel} />
      {creating && <CreateCountModal items={inv.items} onSubmit={create} onClose={() => setCreating(false)} />}
      {cc.selected && <CountDetail count={cc.selected} onRecord={record} onApprove={approve} onApply={apply} onClose={() => void cc.selectCount(null)} />}
    </div>
  );
}
