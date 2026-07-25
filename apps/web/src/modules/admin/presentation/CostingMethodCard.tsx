import { useState } from "react";
import { Layers } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { useCostingMethod } from "@shared/hooks/useCostingMethod";
import type { CostingMethod } from "@shared/lib/costing";

// Método de costeo del tenant (solo CEO). Cambiar a FIFO corre _migrate_to_fifo vía set_costing_method.
export function CostingMethodCard() {
  const { t } = useI18n();
  const { method, change } = useCostingMethod();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  async function apply(next: CostingMethod) {
    if (next === method || saving) return;
    if (next === "fifo" && !window.confirm(t("switchToFifoWarning"))) return;
    setSaving(true);
    const r = await change(next);
    setSaving(false);
    if (r.ok) toast.success(next === "fifo" ? t("migrationComplete") : t("saved"));
    else toast.error(r.error);
  }
  return (
    <div className="max-w-md space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Layers className="h-4 w-4" />{t("costingMethod")}</div>
      <select value={method ?? "weighted_avg"} disabled={saving || method == null}
        onChange={(e) => void apply(e.target.value as CostingMethod)}
        className="w-full rounded-lg border border-border bg-background p-2 text-sm">
        <option value="weighted_avg">{t("weightedAverage")}</option>
        <option value="fifo">{t("fifoFull")}</option>
      </select>
      <p className="text-xs text-muted-foreground">{t("costingMethodHint")}</p>
    </div>
  );
}
