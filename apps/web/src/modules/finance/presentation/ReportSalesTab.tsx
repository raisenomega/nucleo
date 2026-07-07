import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ReportChart } from "@finance/presentation/ReportChart";
import { ReportBars } from "@finance/presentation/ReportBars";
import { ReportPieChart } from "@finance/presentation/ReportPieChart";
import type { ReportSeries } from "@finance/domain/report.types";

const ST: Record<string, TranslationKey> = {
  new: "statusNew", contacted: "statusContacted", quoted: "statusQuoted", converted: "statusConverted", lost: "statusLost",
};

export function ReportSalesTab({ s }: { s: ReportSeries }) {
  const { t } = useI18n();
  const funnel = s.leads_by_status.map((x) => ({ name: t(ST[x.status] ?? "leads"), count: x.count }));
  const pie = s.income_by_category.map((x) => ({ name: x.category, value: x.total }));
  const src = s.marketing_by_channel.filter((c) => c.spent > 0 || c.leads > 0);
  const best = [...s.marketing_by_channel].filter((c) => c.spent > 0).sort((a, b) => b.revenue / b.spent - a.revenue / a.spent)[0];
  const legend = best ? `Tu mejor canal es ${best.channel} con ROI de ${Math.round((best.revenue / best.spent) * 100)}%. Recomendación: incrementar inversión ahí.` : "";
  return (
    <div className="space-y-4">
      <ReportChart title={t("rFunnel")}>
        <ReportBars data={funnel} xKey="name" horizontal bars={[{ key: "count", name: t("leads"), color: "hsl(38 85% 55%)" }]} />
      </ReportChart>
      <ReportChart title={t("rIncomeByCategory")}><ReportPieChart data={pie} /></ReportChart>
      <ReportChart title={t("rTopClients")}>
        <table className="w-full text-sm"><tbody>{s.top_clients.slice(0, 5).map((c, i) => (
          <tr key={i} className="border-b border-border"><td className="p-2">{c.name}</td>
            <td className="p-2 text-right font-bold text-primary">{formatCurrency(c.total)}</td>
            <td className="p-2 text-right text-muted-foreground">{c.count}</td></tr>))}</tbody></table>
      </ReportChart>
      <ReportChart title={t("rLeadsBySource")} legend={legend}>
        <ReportBars data={src.map((c) => ({ channel: c.channel, cac: c.converted > 0 ? Math.round(c.spent / c.converted) : 0 }))} xKey="channel" bars={[{ key: "cac", name: "CAC", color: "hsl(217 91% 60%)" }]} />
      </ReportChart>
    </div>
  );
}
