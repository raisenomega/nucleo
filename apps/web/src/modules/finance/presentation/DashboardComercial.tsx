import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { DashData } from "@finance/application/useDashboard.hook";
import { KpiCard } from "@finance/presentation/KpiCard";
import { DashPie } from "@finance/presentation/DashPie";
import { DashBar } from "@finance/presentation/DashBar";
import { DashList } from "@finance/presentation/DashList";

// Vista profunda Comercial: embudo de ventas + leads por temperatura + cotizaciones por estado + leads recientes.
export function DashboardComercial({ d }: { d: DashData }) {
  const { t } = useI18n();
  const c = d.crm, q = d.quotes;
  const funnel = [{ name: t("webLead"), v: c?.byStatus.new ?? 0 }, { name: "•", v: c?.byStatus.contacted ?? 0 }, { name: t("qsSent"), v: c?.byStatus.quoted ?? 0 }, { name: t("qsConverted"), v: c?.byStatus.converted ?? 0 }];
  const temp = [{ name: "hot", value: c?.byTemperature.hot ?? 0 }, { name: "warm", value: c?.byTemperature.warm ?? 0 }, { name: "cold", value: c?.byTemperature.cold ?? 0 }];
  const qb = [{ name: t("qsDraft"), v: q?.draft ?? 0 }, { name: t("qsSent"), v: q?.sent ?? 0 }, { name: t("qsAccepted"), v: q?.accepted ?? 0 }, { name: t("qsRejected"), v: q?.rejected ?? 0 }];
  const leads = (c?.recentLeads ?? []).map((l) => ({ label: l.contactName, sub: l.status, value: l.temperature }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label={t("leads")} value={`${c?.totalLeads ?? 0}`} sub={`${(c?.conversionRate ?? 0).toFixed(0)}% conv.`} />
        <KpiCard label={t("totalQuoted")} value={formatCurrency(q?.totalQuoted ?? 0)} />
        <KpiCard label={t("newClients")} value={`${d.ops?.customersNew ?? 0}`} />
        <KpiCard label={t("activeClients")} value={`${d.ops?.customersActive ?? 0}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DashBar title={t("salesFunnel")} data={funnel} />
        <DashPie title={t("leadsByTemperature")} data={temp} />
        <DashBar title={t("quotesByStatus")} data={qb} />
      </div>
      <DashList title={t("leads")} rows={leads} />
    </div>
  );
}
