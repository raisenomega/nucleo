import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus, FileText } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { usePdf } from "@shared/hooks/usePdf";
import { useToast } from "@shared/providers/toast-context";
import { useInventory } from "@fieldops/application/useInventory.hook";
import { supabaseInventoryRepository } from "@fieldops/infrastructure/supabase-inventory.repository";
import { InventoryForm } from "@fieldops/presentation/InventoryForm";
import { InventoryTable } from "@fieldops/presentation/InventoryTable";
import { InventoryDetail } from "@fieldops/presentation/InventoryDetail";
import { RestockModal } from "@fieldops/presentation/RestockModal";
import type { InventoryFormData, RestockData, LandingProductRef } from "@fieldops/domain/inventory.types";

export const Route = createFileRoute("/_authenticated/inventory")({ component: InventoryPage });

function InventoryPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { items, create, update, remove, restock } = useInventory(supabaseInventoryRepository);
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [restocking, setRestocking] = useState<string | null>(null);
  const [landing, setLanding] = useState<LandingProductRef[]>([]);
  const pdf = usePdf();
  useEffect(() => { void supabaseInventoryRepository.listLandingProducts().then(setLanding); }, []);
  const exportPdf = () => void pdf.generatePdf("report", null, {
    title: t("inventory"), date_from: "", date_to: "",
    kpis: [{ label: t("stock"), value: String(items.length) }, { label: t("lowStock"), value: String(items.filter((i) => i.stock <= i.minStock).length) }],
    tables: [{ title: t("inventoryList"), headers: [t("itemName"), t("stock"), t("minStock"), t("unitCost")],
      rows: items.map((i) => [i.name, i.stock, i.minStock, `$${i.unitCost.toFixed(2)}`]) }], charts: [],
  });

  const editRow = useMemo<InventoryFormData | undefined>(() => {
    const i = items.find((x) => x.id === editing);
    return i ? { name: i.name, stock: i.stock, unitCost: i.unitCost, minStock: i.minStock, landingProductId: i.landingProductId } : undefined;
  }, [editing, items]);

  async function submit(d: InventoryFormData) { if (editing && editing !== "new") await update(editing, d); else await create(d); setEditing(null); }
  async function doRestock(d: RestockData) { if (!restocking) return; const r = await restock(restocking, d); if (r.ok) { setRestocking(null); toast.success(t("entryRegistered")); } else toast.error(r.error); }

  if (!can("inventory", "view")) return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("inventory")}</h1>
          <div className="flex items-center gap-2">
          <button type="button" disabled={pdf.generating || !items.length} onClick={exportPdf}
            className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-bold disabled:opacity-50"><FileText className="h-4 w-4" /> {pdf.generating ? t("generatingPdf") : t("inventoryReport")}</button>
          {can("inventory", "create") && (
            <button type="button" onClick={() => setEditing("new")}
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold">
              <Plus className="h-4 w-4" /> {t("newItem")}
            </button>
          )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("inventorySubtitle")}</p>
      </div>
      {editing !== null && (
        <InventoryForm key={editing} initial={editRow} landingProducts={landing} onSubmit={submit} onCancel={() => setEditing(null)} />
      )}
      <InventoryTable rows={items} onView={setViewing} onEdit={setEditing} onRestock={setRestocking}
        onDelete={(id) => { if (window.confirm(`${t("delete")}?`)) void remove(id); }} />
      {viewing && (() => { const v = items.find((i) => i.id === viewing); return v ? <InventoryDetail item={v} onClose={() => setViewing(null)} /> : null; })()}
      {restocking && (() => { const it = items.find((i) => i.id === restocking); return it ? <RestockModal item={it} onSubmit={doRestock} onClose={() => setRestocking(null)} /> : null; })()}
    </div>
  );
}
