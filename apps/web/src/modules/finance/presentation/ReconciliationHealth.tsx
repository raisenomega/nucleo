import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { HealthPanel, OperatingStatus } from "@finance/domain/reconciliation-health.types";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const COLOR: Record<OperatingStatus, string> = { surplus: "text-green-600", tight: "text-yellow-600", deficit: "text-red-600" };
const EMOJI: Record<OperatingStatus, string> = { surplus: "🟢", tight: "🟡", deficit: "🔴" };

export function ReconciliationHealth({ health }: { health: HealthPanel }) {
  const { t } = useI18n();
  const marginCol = health.operatingMargin > 20 ? "text-green-600" : health.operatingMargin >= 0 ? "text-yellow-600" : "text-red-600";
  const recent = health.trend.filter((m) => m.income > 0 || m.totalOut > 0).slice(-3);
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-body font-bold text-primary">{t("breakEven")}</h2>
        <span className={`text-xl ${COLOR[health.operatingStatus]}`}>{EMOJI[health.operatingStatus]}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary" style={{ width: `${health.breakEvenPct}%` }} />
      </div>
      <div className="text-sm font-bold">
        {health.surplus > 0
          ? <span className="text-green-600">{t("surplus")}: {formatCurrency(health.surplus)}</span>
          : <span className="text-red-600">{t("shortfall")}: {formatCurrency(health.shortfall)}</span>}
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t("operatingMargin")}</span>
        <span className={`font-bold ${marginCol}`}>{health.operatingMargin}%</span>
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold text-muted-foreground">{t("trend")}</div>
        <div className="flex gap-4">
          {recent.map((m, i) => {
            const prev = i > 0 ? (recent[i - 1]?.margin ?? m.margin) : m.margin;
            const Icon = m.margin > prev ? TrendingUp : m.margin < prev ? TrendingDown : Minus;
            const col = m.margin > prev ? "text-green-600" : m.margin < prev ? "text-red-600" : "text-muted-foreground";
            return (
              <div key={m.month} className="text-center text-xs">
                <div className="text-muted-foreground">{MONTHS[m.month - 1]}</div>
                <div className={`flex items-center gap-1 font-bold ${col}`}><Icon className="h-3 w-3" />{m.margin}%</div>
              </div>
            );
          })}
          {recent.length === 0 && <span className="text-xs text-muted-foreground">{t("noData")}</span>}
        </div>
      </div>
    </div>
  );
}
