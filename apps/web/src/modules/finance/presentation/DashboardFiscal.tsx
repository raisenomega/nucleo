import { Wallet, Landmark } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { FiscalSnapshot } from "@finance/domain/dashboard.types";

const COLOR = { healthy: "text-green-600", tight: "text-yellow-600", at_risk: "text-red-600" } as const;
const KEY = { healthy: "healthy", tight: "tight", at_risk: "atRisk" } as const;

export function DashboardFiscal({ f }: { f: FiscalSnapshot }) {
  const { t } = useI18n();
  const color = COLOR[f.status];
  const pct = f.totalIncome > 0 ? Math.round((f.taxEstimated / f.totalIncome) * 100) : 0;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="h-4 w-4 text-primary" /> {t("availableBalance")}</div>
        <div className={`text-2xl font-black md:text-3xl ${color}`}>{formatCurrency(f.availableBalance)}</div>
        <div className={`text-xs font-bold ${color}`}>{t(KEY[f.status])}</div>
      </div>
      <div className="space-y-2 rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Landmark className="h-4 w-4 text-primary" /> {t("taxObligations")}</div>
        <div className="text-2xl font-black md:text-3xl">{formatCurrency(f.taxEstimated)}</div>
        <div className="text-xs text-muted-foreground">{pct}% · {t("income")}</div>
      </div>
    </div>
  );
}
