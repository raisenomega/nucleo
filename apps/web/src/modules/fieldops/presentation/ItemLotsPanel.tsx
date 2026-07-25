import { useEffect } from "react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { formatCurrency } from "@shared/lib/format";
import { useInventoryLots } from "@fieldops/application/useInventoryLots.hook";
import { supabaseInventoryLotRepository } from "@fieldops/infrastructure/supabase-inventory-lot.repository";
import type { InventoryLot, LotStatus } from "@fieldops/domain/inventory-lot.types";

const BADGE: Record<LotStatus, string> = { available: "bg-green-500/10 text-green-600", quarantine: "bg-amber-500/10 text-amber-600", expired: "bg-destructive/10 text-destructive", consumed: "bg-secondary text-muted-foreground", recalled: "bg-destructive/10 text-destructive" };
const daysTo = (d: string | null, now: number) => (d == null ? null : Math.round((new Date(d).getTime() - now) / 86400000));
const expCls = (n: number | null) => (n == null ? "" : n < 7 ? "font-bold text-destructive" : n <= 30 ? "text-amber-600" : "text-green-600");

// Gestor de lotes/series de un ítem (solo si tracking != none). Estado + caducidad con color + cuarentena/retiro.
export function ItemLotsPanel({ item, serial }: { item: string; serial: boolean }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const toast = useToast();
  const lots = useInventoryLots(supabaseInventoryLotRepository);
  const now = Date.now();
  useEffect(() => { void lots.loadByItem(item); }, [item]);
  const setStatus = async (l: InventoryLot, s: LotStatus) => { const r = await lots.updateStatus(l.id, s, item); if (!r.ok) toast.error(r.error); };
  const th = "px-2 py-1 text-left font-bold";
  return (
    <div className="space-y-1">
      <div className="text-xs font-bold uppercase text-muted-foreground">{serial ? t("serialTracking") : t("lotTracking")}</div>
      <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
          <th className={th}>{serial ? t("serialNumber") : t("lotNumber")}</th><th className={th}>{t("warehouse")}</th><th className={`${th} text-right`}>{serial ? t("lotStatus") : t("quantity")}</th><th className={th}>{t("expiryDate")}</th>{can("inventory", "cost") && <th className={`${th} text-right`}>{t("cost")}</th>}<th className={`${th} text-right`}>{t("actions")}</th>
        </tr></thead>
        <tbody>{lots.lots.map((l) => { const d = daysTo(l.expiryDate, now); return (
          <tr key={l.id} className="border-t border-border">
            <td className="px-2 py-1 font-semibold">{l.lotNumber} <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs font-bold ${BADGE[l.status]}`}>{t(l.status)}</span></td>
            <td className="px-2 py-1 text-muted-foreground">{l.warehouseName}</td>
            <td className="px-2 py-1 text-right">{serial ? t(l.quantity > 0 ? "available" : "consumed") : l.quantity}</td>
            <td className={`px-2 py-1 ${expCls(d)}`}>{l.expiryDate ? l.expiryDate.slice(0, 10) : "—"}{d != null && d >= 0 && d <= 30 ? ` (${d}d)` : ""}</td>
            {can("inventory", "cost") && <td className="px-2 py-1 text-right text-muted-foreground">{l.unitCost != null ? formatCurrency(l.unitCost) : "—"}</td>}
            <td className="px-2 py-1 text-right">{can("inventory", "edit") && (l.status === "available" || l.status === "quarantine") && <><button type="button" onClick={() => void setStatus(l, l.status === "quarantine" ? "available" : "quarantine")} className="text-xs text-amber-600">{l.status === "quarantine" ? t("setAvailable") : t("setQuarantine")}</button><button type="button" onClick={() => { if (window.confirm(`${t("recall")}?`)) void setStatus(l, "recalled"); }} className="ml-2 text-xs text-destructive">{t("recall")}</button></>}</td>
          </tr>
        ); })}</tbody>
      </table></div>
    </div>
  );
}
