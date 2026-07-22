import { useState } from "react";
import { Boxes } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { linkProductToInventory } from "@landing/infrastructure/supabase-landing-products.repository";
import type { SectionProps } from "@landing/presentation/product-modal.hooks";

const numOrNull = (v: string): number | null => (v === "" ? null : Number(v));

// productId presente = modo edición → permite vincular el producto a un inventory_item con SKU (idempotente).
export function ProductInventorySection({ form, set, productId }: SectionProps & { productId?: string }) {
  const { t } = useI18n(); const toast = useToast(); const [busy, setBusy] = useState(false);
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  const link = async () => {
    if (!productId) return; setBusy(true);
    const r = await linkProductToInventory(productId); setBusy(false);
    if ("error" in r) toast.error(r.error);
    else toast.success(r.alreadyLinked ? `Ya vinculado (SKU ${form.sku || "—"})` : `Vinculado al inventario · SKU ${r.sku}`);
  };
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.trackInventory} onChange={(e) => set("trackInventory", e.target.checked)} /> {t("trackInventory")}</label>
      {form.trackInventory && <div className="flex flex-wrap gap-3">
        <label className="block"><span className={lbl}>{t("stockQuantity")}</span>
          <input type="number" value={form.stockQuantity ?? ""} onChange={(e) => set("stockQuantity", numOrNull(e.target.value))} className={`w-28 ${fld}`} /></label>
        <label className="block"><span className={lbl}>{t("lowStockThreshold")}</span>
          <input type="number" value={form.lowStockThreshold ?? ""} onChange={(e) => set("lowStockThreshold", numOrNull(e.target.value))} className={`w-28 ${fld}`} /></label>
      </div>}
      {form.trackInventory && productId && <button type="button" disabled={busy} onClick={() => void link()} className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm font-bold text-foreground disabled:opacity-50"><Boxes className="h-4 w-4" />Vincular a inventario</button>}
    </div>
  );
}
