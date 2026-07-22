import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Boxes, PackagePlus, SlidersHorizontal, ExternalLink } from "lucide-react";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { getProductInventorySnapshot, type ProductSnapshot } from "@fieldops/infrastructure/product-inventory.repository";
import { supabaseInventoryRepository as repo } from "@fieldops/infrastructure/supabase-inventory.repository";
import { linkProductToInventory } from "@landing/infrastructure/supabase-landing-products.repository";
import { InventoryMovements } from "@fieldops/presentation/InventoryMovements";
import { RestockModal } from "@fieldops/presentation/RestockModal";
import { StockActionModal } from "@fieldops/presentation/StockActionModal";
import type { RestockData } from "@fieldops/domain/inventory.types";

// Drill-down: inventario de un producto vendido en una línea de factura. Reutiliza kardex + modales de 2.2b.
export function LineItemInventoryPanel({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { can } = useModuleAccess(); const toast = useToast();
  const [snap, setSnap] = useState<ProductSnapshot | null>(null);
  const [rev, setRev] = useState(0); const [modal, setModal] = useState<"restock" | "adjust" | null>(null);
  const edit = can("inventory", "edit");
  const load = useCallback(() => { void getProductInventorySnapshot(productId).then(setSnap); }, [productId]);
  useEffect(load, [load]);
  const done = (e: string | null) => { setModal(null); if (e) toast.error(e); else { toast.success("Actualizado"); load(); setRev((r) => r + 1); } };
  const doRestock = async (d: RestockData) => { const r = await repo.restock(snap!.item!.id, d); done(r.ok ? null : r.error); };
  const doAdjust = async (q: number, reason: string) => { const r = await repo.adjust(snap!.item!.id, q, reason); done(r.ok ? null : r.error); };
  const doLink = async () => { const r = await linkProductToInventory(productId); if ("error" in r) toast.error(r.error); else { toast.success(`SKU ${r.sku || "—"}`); load(); } };
  const it = snap?.item;
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-foreground"><Boxes className="h-5 w-5" />{it ? `${it.sku || "—"} · ${it.name}` : "Inventario"}</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar"><X className="h-6 w-6" /></button>
      </div>
      {!snap ? <p className="p-4 text-sm text-muted-foreground">Cargando…</p>
        : !snap.linked ? (
        <div className="space-y-3 p-4 text-center">
          <p className="text-sm text-muted-foreground">Este producto no está vinculado a inventario.</p>
          {edit && <button type="button" onClick={() => void doLink()} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Boxes className="h-4 w-4" />Vincular a inventario</button>}
        </div>
      ) : (
        <div className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 text-sm">
            <span>Stock: <span className="text-lg font-bold text-foreground">{it!.stock}</span></span>
            {snap.isLow && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs font-bold text-red-600">Bajo</span>}
            {snap.stockValue != null && <span className="ml-auto text-xs text-muted-foreground">Costo prom. {formatCurrency(it!.avgCost)} · Valor {formatCurrency(snap.stockValue)}</span>}
          </div>
          <InventoryMovements key={rev} itemId={it!.id} />
          <div className="flex flex-wrap gap-2">
            {edit && <button type="button" onClick={() => setModal("restock")} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><PackagePlus className="h-4 w-4" />Restock</button>}
            {edit && <button type="button" onClick={() => setModal("adjust")} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold text-foreground"><SlidersHorizontal className="h-4 w-4" />Ajustar</button>}
            <Link to="/inventory" className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold text-foreground"><ExternalLink className="h-4 w-4" />Ver en inventario</Link>
          </div>
        </div>
      )}
      {modal === "restock" && it && <RestockModal item={it} suppliers={[]} onSubmit={(d) => void doRestock(d)} onClose={() => setModal(null)} />}
      {modal === "adjust" && it && <StockActionModal item={it} mode="adjust" onSubmit={(q, r) => void doAdjust(q, r)} onClose={() => setModal(null)} />}
    </ScreenModal>
  );
}
