import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { InventoryTable } from "@fieldops/presentation/InventoryTable";
import { InventoryDetail } from "@fieldops/presentation/InventoryDetail";
import { RestockModal } from "@fieldops/presentation/RestockModal";
import { StockActionModal } from "@fieldops/presentation/StockActionModal";
import { TransferModal } from "@fieldops/presentation/TransferModal";
import { useInventory } from "@fieldops/application/useInventory.hook";
import type { RawMov } from "@fieldops/application/inventory-analytics";
import type { InventoryItem, RestockData, TransferData } from "@fieldops/domain/inventory.types";
import type { SupplierRef } from "@fieldops/domain/supplier.types";

type Inv = ReturnType<typeof useInventory>;

// Bundle: tabla + modales de item (detalle/restock/ajuste-merma/transferencia). Mantiene la ruta liviana.
export function InventoryItemsPanel({ inv, rows, movs, now, suppliers, slow, high, reorder, onEdit, onDelete }: {
  inv: Inv; rows: readonly InventoryItem[]; movs: RawMov[]; now: Date; suppliers: readonly SupplierRef[];
  slow: ReadonlySet<string>; high: ReadonlySet<string>; reorder: ReadonlySet<string>;
  onEdit: (id: string) => void; onDelete: (id: string) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [viewing, setViewing] = useState<string | null>(null);
  const [restocking, setRestocking] = useState<string | null>(null);
  const [action, setAction] = useState<{ id: string; mode: "adjust" | "shrink" } | null>(null);
  const [transferring, setTransferring] = useState<string | null>(null);
  const find = (id: string | null | undefined) => inv.items.find((i) => i.id === id);
  async function doRestock(d: RestockData) { if (!restocking) return; const r = await inv.restock(restocking, d); if (r.ok) { setRestocking(null); toast.success(t("entryRegistered")); } else toast.error(r.error); }
  async function doAction(qty: number, reason: string) { if (!action) return; const r = action.mode === "adjust" ? await inv.adjust(action.id, qty, reason) : await inv.shrink(action.id, qty, reason); if (r.ok) { setAction(null); toast.success(t("saved")); } else toast.error(r.error); }
  async function doTransfer(d: TransferData) { if (!transferring) return; const r = await inv.transfer(transferring, d); if (r.ok) { setTransferring(null); toast.success(t("saved")); } else toast.error(r.error); }
  const view = find(viewing); const rs = find(restocking); const ac = find(action?.id); const tr = find(transferring);
  return (
    <>
      <InventoryTable rows={rows} slow={slow} high={high} reorder={reorder} onView={setViewing} onEdit={onEdit} onDelete={onDelete} onRestock={setRestocking} onAdjust={(id) => setAction({ id, mode: "adjust" })} onShrink={(id) => setAction({ id, mode: "shrink" })} onTransfer={setTransferring} />
      {view && <InventoryDetail item={view} movs={movs} now={now} onClose={() => setViewing(null)} />}
      {rs && <RestockModal item={rs} suppliers={suppliers} onSubmit={doRestock} onClose={() => setRestocking(null)} />}
      {ac && action && <StockActionModal item={ac} mode={action.mode} onSubmit={doAction} onClose={() => setAction(null)} />}
      {tr && <TransferModal item={tr} onSubmit={doTransfer} onClose={() => setTransferring(null)} />}
    </>
  );
}
