import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { InventoryMovements } from "@fieldops/presentation/InventoryMovements";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

export function InventoryDetail({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const row = (label: string, v: string) => (
    <div><dt className="inline text-muted-foreground">{label}: </dt><dd className="inline">{v}</dd></div>
  );
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4 md:p-6">
        <h2 className="font-display text-xl font-bold text-foreground">{item.name}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4 md:p-6">
        <dl className="space-y-1 font-body text-sm">
          {row(t("stock"), String(item.stock))}
          {can("inventory", "cost") && row(t("unitCost"), formatCurrency(item.unitCost))}
          {row(t("minStock"), String(item.minStock))}
        </dl>
        <InventoryMovements itemId={item.id} />
      </div>
    </ScreenModal>
  );
}
