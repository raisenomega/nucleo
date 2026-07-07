import { useI18n } from "@shared/i18n";
import { ReportChart } from "@finance/presentation/ReportChart";
import { ReportBars } from "@finance/presentation/ReportBars";
import type { ReportSeries } from "@finance/domain/report.types";

export function ReportMarketingTab({ s }: { s: ReportSeries }) {
  const { t } = useI18n();
  const ch = s.marketing_by_channel.filter((c) => c.budget > 0 || c.spent > 0 || c.leads > 0);
  const bs = ch.map((c) => ({ channel: c.channel, budget: c.budget, spent: c.spent }));
  const cac = ch.filter((c) => c.converted > 0).map((c) => ({ channel: c.channel, cac: Math.round(c.spent / c.converted) }));
  const roi = ch.filter((c) => c.spent > 0).map((c) => ({ channel: c.channel, roi: Math.round((c.revenue / c.spent) * 100) }));
  const best = [...roi].sort((a, b) => b.roi - a.roi)[0];
  const most = [...ch].sort((a, b) => b.leads - a.leads)[0];
  const legend = `${best ? `${best.channel} tiene el mejor ROI (${best.roi}%). ` : ""}${most && most.leads > 0 ? `${most.channel} genera más leads.` : ""}`;
  return (
    <div className="space-y-4">
      <ReportChart title={t("rBudgetVsSpent")}>
        <ReportBars data={bs} xKey="channel" bars={[{ key: "budget", name: t("budgetedAmount"), color: "hsl(217 91% 60%)" }, { key: "spent", name: t("spent"), color: "hsl(38 85% 55%)" }]} />
      </ReportChart>
      <ReportChart title={t("rCacByChannel")}>
        <ReportBars data={cac} xKey="channel" bars={[{ key: "cac", name: "CAC", color: "hsl(0 72% 51%)" }]} />
      </ReportChart>
      <ReportChart title={t("rRoiByChannel")} legend={legend}>
        <ReportBars data={roi} xKey="channel" bars={[{ key: "roi", name: "ROI %", color: "hsl(142 71% 45%)" }]} />
      </ReportChart>
    </div>
  );
}
