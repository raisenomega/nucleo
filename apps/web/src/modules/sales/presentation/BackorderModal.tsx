import { AlertTriangle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { Backorder } from "@sales/domain/sales-order.types";

export function BackorderModal({ items, onClose }: { items: readonly Backorder[]; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2 text-amber-600"><AlertTriangle className="h-6 w-6" /><h2 className="font-display text-lg font-bold">{t("backorderTitle")}</h2></div>
        <p className="text-sm text-muted-foreground">{t("backorderWarning")}</p>
        <ul className="space-y-1 text-sm">{items.map((b, i) => (
          <li key={i} className="rounded bg-secondary px-3 py-2"><span className="font-semibold">{b.description}</span>: {t("qtyBackordered")} {b.qty_backordered}</li>))}</ul>
        <button type="button" onClick={onClose} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">{t("understood")}</button>
      </div>
    </ScreenModal>
  );
}
