import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { usePurchaseOrders } from "@fieldops/application/usePurchaseOrders.hook";
import { supabasePurchaseOrderRepository } from "@fieldops/infrastructure/supabase-purchase-orders.repository";
import { PurchaseOrdersTable } from "@fieldops/presentation/PurchaseOrdersTable";
import { PurchaseOrderForm } from "@fieldops/presentation/PurchaseOrderForm";
import { PurchaseOrderDetail } from "@fieldops/presentation/PurchaseOrderDetail";
import { ReceiveModal } from "@fieldops/presentation/ReceiveModal";
import { ReorderSuggestionsModal } from "@fieldops/presentation/ReorderSuggestionsModal";
import type { POCreateData, POStatus, POLine, ReorderSuggestion } from "@fieldops/domain/purchase-order.types";
import type { InventoryItem } from "@fieldops/domain/inventory.types";
import type { SupplierRef } from "@fieldops/domain/supplier.types";

// Sección órdenes de compra + reorden, self-contained (hook propio). onChanged refresca el inventario tras recibir.
export function InventoryPurchaseOrders({ suppliers, items, onChanged }: {
  suppliers: readonly SupplierRef[]; items: readonly InventoryItem[]; onChanged: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const po = usePurchaseOrders(supabasePurchaseOrderRepository);
  const [creating, setCreating] = useState<{ supplier: string | null; lines: POLine[] } | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [receiving, setReceiving] = useState<string | null>(null);
  const [suggest, setSuggest] = useState<ReorderSuggestion[] | null>(null);
  const view = po.items.find((o) => o.id === viewing);
  const recv = po.items.find((o) => o.id === receiving);
  async function create(d: POCreateData) { const r = await po.create(d); if (r.ok) { setCreating(null); toast.success(t("saved")); } else toast.error(r.error); }
  async function status(id: string, s: POStatus) { const r = await po.setStatus(id, s); if (r.ok) { setViewing(null); toast.success(t("saved")); } else toast.error(r.error); }
  async function doReceive(its: { itemId: string; receivedQty: number }[]) { if (!receiving) return; const r = await po.receive(receiving, its); if (r.ok) { setReceiving(null); onChanged(); toast.success(t("saved")); } else toast.error(r.error); }
  const fromSuggest = (s: readonly ReorderSuggestion[]) => { setSuggest(null); setCreating({ supplier: s[0]?.supplierId ?? null, lines: s.map((x) => ({ itemId: x.itemId, quantity: x.reorderQty, unitCost: x.unitCost })) }); };
  return (
    <>
      <PurchaseOrdersTable rows={po.items} onAdd={() => setCreating({ supplier: null, lines: [] })} onView={setViewing} onSuggest={() => void supabasePurchaseOrderRepository.suggestions().then(setSuggest)} />
      {creating && <PurchaseOrderForm suppliers={suppliers} items={items} initialSupplier={creating.supplier} initialLines={creating.lines} onSubmit={create} onClose={() => setCreating(null)} />}
      {view && <PurchaseOrderDetail order={view} onStatus={(s) => void status(view.id, s)} onReceive={() => { setReceiving(view.id); setViewing(null); }} onClose={() => setViewing(null)} />}
      {recv && <ReceiveModal order={recv} onSubmit={doReceive} onClose={() => setReceiving(null)} />}
      {suggest && <ReorderSuggestionsModal suggestions={suggest} onCreate={fromSuggest} onClose={() => setSuggest(null)} />}
    </>
  );
}
