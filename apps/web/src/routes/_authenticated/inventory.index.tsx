import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus, FileText } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useSession } from "@shared/providers/SessionProvider";
import { usePdf } from "@shared/hooks/usePdf";
import { useInventory } from "@fieldops/application/useInventory.hook";
import { useSuppliers } from "@fieldops/application/useSuppliers.hook";
import { useInventoryAnalytics } from "@fieldops/application/useInventoryAnalytics.hook";
import { supabaseInventoryRepository } from "@fieldops/infrastructure/supabase-inventory.repository";
import { supabaseSupplierRepository } from "@fieldops/infrastructure/supabase-suppliers.repository";
import { InventoryForm } from "@fieldops/presentation/InventoryForm";
import { InventoryItemsPanel } from "@fieldops/presentation/InventoryItemsPanel";
import { InventoryKpis } from "@fieldops/presentation/InventoryKpis";
import { InventoryDashboard } from "@fieldops/presentation/InventoryDashboard";
import { InventoryFilters, type InvFilter } from "@fieldops/presentation/InventoryFilters";
import { inventoryReportBody } from "@fieldops/presentation/inventory-report";
import type { InventoryFormData, LandingProductRef } from "@fieldops/domain/inventory.types";

export const Route = createFileRoute("/_authenticated/inventory/")({ component: InventoryPage });

function InventoryPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { session } = useSession();
  const inv = useInventory(supabaseInventoryRepository);
  const sup = useSuppliers(supabaseSupplierRepository);
  const { movs, slow, high, now } = useInventoryAnalytics(inv.items);
  const pdf = usePdf();
  const [editing, setEditing] = useState<string | null>(null);
  const [landing, setLanding] = useState<LandingProductRef[]>([]);
  const [filter, setFilter] = useState<InvFilter>("all");
  const [search, setSearch] = useState("");
  const items = inv.items;
  useEffect(() => { void supabaseInventoryRepository.listLandingProducts().then(setLanding); }, []);
  const reorder = useMemo(() => new Set(items.filter((i) => i.reorderPoint != null && i.stock <= i.reorderPoint && (i.reorderQty ?? 0) > 0).map((i) => i.id)), [items]);
  const shown = useMemo(() => items.filter((i) => {
    const low = i.minStock > 0 && i.stock <= i.minStock; const q = search.trim().toLowerCase();
    return (filter === "all" || (filter === "low" && low) || (filter === "catalog" && i.landingProductId) || (filter === "nostock" && i.stock <= 0) || (filter === "slow" && slow.has(i.id)) || (filter === "reorder" && reorder.has(i.id))) && (!q || `${i.name} ${i.sku} ${i.warehouseZone} ${i.aisle} ${i.shelf} ${i.bin}`.toLowerCase().includes(q));
  }), [items, filter, search, slow, reorder]);
  const editRow = useMemo<InventoryFormData | undefined>(() => { const i = items.find((x) => x.id === editing); return i ? { name: i.name, sku: i.sku, stock: i.stock, unitCost: i.unitCost, minStock: i.minStock, landingProductId: i.landingProductId, supplierId: i.supplierId, warehouseZone: i.warehouseZone, aisle: i.aisle, shelf: i.shelf, bin: i.bin, reorderPoint: i.reorderPoint, reorderQty: i.reorderQty } : undefined; }, [editing, items]);
  async function submit(d: InventoryFormData) { if (editing && editing !== "new") await inv.update(editing, d); else await inv.create(d); setEditing(null); }
  const onDelete = (id: string) => { if (window.confirm(`${t("delete")}?`)) void inv.remove(id); };

  if (!can("inventory", "view")) return <Navigate to="/dashboard" />;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("inventory")}</h1>
        <div className="flex items-center gap-2">
          <button type="button" disabled={pdf.generating || !items.length} onClick={() => void pdf.generatePdf("report", null, inventoryReportBody(items, movs, sup.items, now, t))} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-bold disabled:opacity-50"><FileText className="h-4 w-4" /> {pdf.generating ? t("generatingPdf") : t("inventoryReport")}</button>
          {can("inventory", "create") && <button type="button" onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold"><Plus className="h-4 w-4" /> {t("newItem")}</button>}
        </div>
      </div>
      <InventoryKpis items={items} />
      <InventoryDashboard movs={movs} items={items} now={now} />
      <InventoryFilters filter={filter} search={search} onFilter={setFilter} onSearch={setSearch} />
      {editing !== null && <InventoryForm key={editing} initial={editRow} itemId={editing !== "new" ? editing : undefined} photoUrls={items.find((i) => i.id === editing)?.photoUrls} tenantId={session?.tenantId ?? ""} landingProducts={landing} suppliers={sup.items} onSubmit={submit} onCancel={() => setEditing(null)} />}
      <InventoryItemsPanel inv={inv} rows={shown} movs={movs} now={now} suppliers={sup.items} slow={slow} high={high} reorder={reorder} onEdit={setEditing} onDelete={onDelete} />
    </div>
  );
}
