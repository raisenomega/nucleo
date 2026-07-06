import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import type { InventoryFormData } from "@fieldops/domain/inventory.types";

export function InventoryForm({ initial, onSubmit, onCancel }: {
  initial?: InventoryFormData;
  onSubmit: (d: InventoryFormData) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const [f, setF] = useState<InventoryFormData>(initial ?? { name: "", stock: 0, unitCost: 0, minStock: 0 });
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  const num = (k: "stock" | "unitCost" | "minStock", label: string) => (
    <label className="space-y-1"><span className={lbl}>{label}</span>
      <input type="number" step="0.01" min="0" value={f[k] || ""}
        onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })} className={field} /></label>
  );
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold">{t("newItem")}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-1"><span className={lbl}>{t("itemName")}</span>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} /></label>
        {num("stock", t("stock"))}
        {can("inventory", "cost") && num("unitCost", t("unitCost"))}
        {num("minStock", t("minStock"))}
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
      </div>
    </form>
  );
}
