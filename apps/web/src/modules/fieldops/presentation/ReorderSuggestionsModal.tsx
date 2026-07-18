import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { ReorderSuggestion } from "@fieldops/domain/purchase-order.types";

// FIX8 — sugerencias de reorden (items bajo punto de reorden) → crear orden de compra pre-llena.
export function ReorderSuggestionsModal({ suggestions, onCreate, onClose }: {
  suggestions: readonly ReorderSuggestion[]; onCreate: (s: readonly ReorderSuggestion[]) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("reorderSuggestions")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        {suggestions.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRecords")}</p> : (<>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground"><tr><th className="text-left">{t("itemName")}</th><th className="text-right">{t("stock")}</th><th className="text-right">{t("reorderPoint")}</th><th className="text-right">{t("reorderQty")}</th><th className="text-left">{t("supplier")}</th></tr></thead>
            <tbody>{suggestions.map((s) => (<tr key={s.itemId} className="border-t border-border"><td className="py-1">{s.name}</td><td className="py-1 text-right text-destructive">{s.stock}</td><td className="py-1 text-right">{s.reorderPoint}</td><td className="py-1 text-right font-semibold">{s.reorderQty}</td><td className="py-1">{s.supplierName}</td></tr>))}</tbody>
          </table></div>
          <button type="button" onClick={() => onCreate(suggestions)} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("createPO")}</button>
        </>)}
      </div>
    </ScreenModal>
  );
}
