import { FileText, TrendingUp, UserPlus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { CrmSnapshot } from "@finance/domain/dashboard.types";

export function DashboardCrm({ c }: { c: CrmSnapshot }) {
  const { t } = useI18n();
  const card = "space-y-2 rounded-lg border border-border bg-card p-5";
  const amount = "text-2xl font-black md:text-3xl";
  const lbl = "flex items-center gap-2 text-xs text-muted-foreground";
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className={card}>
        <div className={lbl}><UserPlus className="h-4 w-4 text-blue-600" /> {t("totalLeads")}</div>
        <div className={`${amount} text-blue-600`}>{c.totalLeads}</div>
      </div>
      <div className={card}>
        <div className={lbl}><FileText className="h-4 w-4 text-primary" /> {t("totalQuoted")}</div>
        <div className={`${amount} text-primary`}>{formatCurrency(c.totalQuoted)}</div>
      </div>
      <div className={card}>
        <div className={lbl}><TrendingUp className="h-4 w-4 text-green-600" /> {t("conversionRate")}</div>
        <div className={`${amount} ${c.conversionRate >= 30 ? "text-green-600" : "text-destructive"}`}>{c.conversionRate}%</div>
      </div>
    </div>
  );
}
