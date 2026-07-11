import { useI18n } from "@shared/i18n";
import type { SectionProps } from "@landing/presentation/product-modal.hooks";

const numOrNull = (v: string): number | null => (v === "" ? null : Number(v));

export function ProductInventorySection({ form, set }: SectionProps) {
  const { t } = useI18n();
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.trackInventory} onChange={(e) => set("trackInventory", e.target.checked)} /> {t("trackInventory")}</label>
      {form.trackInventory && <div className="flex flex-wrap gap-3">
        <label className="block"><span className={lbl}>{t("stockQuantity")}</span>
          <input type="number" value={form.stockQuantity ?? ""} onChange={(e) => set("stockQuantity", numOrNull(e.target.value))} className={`w-28 ${fld}`} /></label>
        <label className="block"><span className={lbl}>{t("lowStockThreshold")}</span>
          <input type="number" value={form.lowStockThreshold ?? ""} onChange={(e) => set("lowStockThreshold", numOrNull(e.target.value))} className={`w-28 ${fld}`} /></label>
      </div>}
    </div>
  );
}
