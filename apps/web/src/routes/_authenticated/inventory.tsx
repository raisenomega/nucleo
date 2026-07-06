import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { useInventory } from "@fieldops/application/useInventory.hook";
import { supabaseInventoryRepository } from "@fieldops/infrastructure/supabase-inventory.repository";
import { InventoryForm } from "@fieldops/presentation/InventoryForm";
import { InventoryTable } from "@fieldops/presentation/InventoryTable";
import { InventoryDetail } from "@fieldops/presentation/InventoryDetail";
import type { InventoryFormData } from "@fieldops/domain/inventory.types";

export const Route = createFileRoute("/_authenticated/inventory")({ component: InventoryPage });

function InventoryPage() {
  const { t } = useI18n();
  const { canEdit } = useRoleGate();
  const { items, create, update, remove } = useInventory(supabaseInventoryRepository);
  const [editing, setEditing] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  const editRow = useMemo<InventoryFormData | undefined>(() => {
    const i = items.find((x) => x.id === editing);
    return i ? { name: i.name, stock: i.stock, unitCost: i.unitCost, minStock: i.minStock } : undefined;
  }, [editing, items]);

  async function submit(d: InventoryFormData) {
    if (editing && editing !== "new") await update(editing, d); else await create(d);
    setEditing(null);
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t("inventory")}</h1>
          <p className="text-xs text-muted-foreground">{t("inventorySubtitle")}</p>
        </div>
        {canEdit("coo") && (
          <button type="button" onClick={() => setEditing("new")}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">
            <Plus className="h-4 w-4" /> {t("newItem")}
          </button>
        )}
      </div>
      {editing !== null && (
        <InventoryForm key={editing} initial={editRow} onSubmit={submit} onCancel={() => setEditing(null)} />
      )}
      <InventoryTable rows={items} onView={setViewing} onEdit={setEditing}
        onDelete={(id) => { if (window.confirm(`${t("delete")}?`)) void remove(id); }} />
      {viewing && (() => { const v = items.find((i) => i.id === viewing); return v ? <InventoryDetail item={v} onClose={() => setViewing(null)} /> : null; })()}
    </div>
  );
}
