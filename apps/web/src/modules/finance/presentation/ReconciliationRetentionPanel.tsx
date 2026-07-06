import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { RetentionPanel } from "@finance/domain/reconciliation.types";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function ReconciliationRetentionPanel({ retention }: { retention: RetentionPanel }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const marginColor = (m: number) => (m > 20 ? "text-green-600" : m >= 0 ? "text-yellow-600" : "text-red-600");
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between font-body font-bold text-primary">
        <span>{t("retentionAuto")} {retention.retentionPct}%</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground">
                <th className="py-1">{t("month")}</th><th className="text-right">{t("income")}</th>
                <th className="text-right">{t("retentionFund")}</th><th className="text-right">{t("egresos")}</th>
                <th className="text-right">{t("operatingProfit")}</th><th className="text-right">{t("operatingMargin")}</th>
                <th className="text-right">{t("accumulated")}</th>
              </tr></thead>
              <tbody>
                {retention.monthly.map((m) => (
                  <tr key={m.month} className="border-t border-border">
                    <td className="py-1">{MONTHS[m.month - 1]}</td>
                    <td className="text-right">{formatCurrency(m.income)}</td>
                    <td className="text-right font-semibold text-primary">{formatCurrency(m.retention)}</td>
                    <td className="text-right">{formatCurrency(m.totalOut)}</td>
                    <td className="text-right">{formatCurrency(m.operatingProfit)}</td>
                    <td className={`text-right ${marginColor(m.margin)}`}>{m.margin}%</td>
                    <td className="text-right font-semibold">{formatCurrency(m.accumulated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">{t("retentionAutoNote")}</p>
        </>
      )}
    </div>
  );
}
