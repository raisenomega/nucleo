import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { supabaseInventoryLotRepository } from "@fieldops/infrastructure/supabase-inventory-lot.repository";
import type { InventoryLot } from "@fieldops/domain/inventory-lot.types";

// Visor de capas de costo FIFO de un ítem tracking=none (solo tenant fifo). Received ASC = orden de consumo.
export function CostLayersPanel({ itemId }: { itemId: string }) {
  const { t } = useI18n();
  const [layers, setLayers] = useState<InventoryLot[]>([]);
  const [showConsumed, setShowConsumed] = useState(false);
  useEffect(() => { void supabaseInventoryLotRepository.listCostLayers(itemId).then(setLayers); }, [itemId]);
  const rows = showConsumed ? layers : layers.filter((l) => l.status === "available");
  const th = "px-2 py-1 text-left font-bold";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground"><Layers className="h-3.5 w-3.5" />{t("costLayers")}</div>
        <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={showConsumed} onChange={(e) => setShowConsumed(e.target.checked)} />{t("showConsumedLayers")}</label>
      </div>
      {rows.length === 0 ? <p className="text-xs text-muted-foreground">{t("noRecords")}</p> : (
        <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className={th}>{t("costLayer")}</th><th className={th}>{t("warehouse")}</th><th className={`${th} text-right`}>{t("quantity")}</th><th className={`${th} text-right`}>{t("cogsUnit")}</th><th className={`${th} text-right`}>{t("value")}</th><th className={th}>{t("receivedDate")}</th><th className={th}>{t("lotStatus")}</th>
          </tr></thead>
          <tbody>{rows.map((l) => (
            <tr key={l.id} className={`border-t border-border ${l.status === "consumed" ? "opacity-50" : ""}`}>
              <td className="px-2 py-1 font-semibold">{l.lotNumber}</td>
              <td className="px-2 py-1 text-muted-foreground">{l.warehouseName}</td>
              <td className="px-2 py-1 text-right">{l.quantity}</td>
              <td className="px-2 py-1 text-right">{l.unitCost != null ? formatCurrency(l.unitCost) : "—"}</td>
              <td className="px-2 py-1 text-right">{formatCurrency(l.quantity * (l.unitCost ?? 0))}</td>
              <td className="px-2 py-1 text-muted-foreground">{l.receivedDate ? l.receivedDate.slice(0, 10) : "—"}</td>
              <td className="px-2 py-1"><span className={l.status === "available" ? "text-green-600" : "text-muted-foreground"}>{t(l.status)}</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}
