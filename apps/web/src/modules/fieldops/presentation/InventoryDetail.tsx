import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

export function InventoryDetail({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const row = (label: string, v: string) => (
    <div><dt className="inline text-muted-foreground">{label}: </dt><dd className="inline">{v}</dd></div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-3 rounded-lg border border-border bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-primary">{item.name}</h2>
          <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-5 w-5" /></button>
        </div>
        <dl className="space-y-1 font-body text-sm">
          {row(t("stock"), String(item.stock))}
          {can("inventory", "cost") && row(t("unitCost"), formatCurrency(item.unitCost))}
          {row(t("minStock"), String(item.minStock))}
        </dl>
        <p className="text-xs text-muted-foreground">{t("movementsSoon")}</p>
      </div>
    </div>
  );
}
