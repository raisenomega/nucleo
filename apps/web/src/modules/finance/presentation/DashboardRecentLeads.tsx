import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { StatusBadge, TempBadge } from "@crm/presentation/LeadBadges";
import type { RecentLead } from "@finance/domain/dashboard.types";

export function DashboardRecentLeads({ leads }: { leads: readonly RecentLead[] }) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4 font-body font-bold">{t("recentLeads")}</div>
      <ul className="divide-y divide-border">
        {leads.length === 0 && <li className="p-4 font-body text-sm text-muted-foreground">{t("noData")}</li>}
        {leads.map((l, i) => (
          <li key={i} className="flex items-center justify-between gap-2 p-3 font-body text-sm">
            <span className="flex-1 truncate">{l.contactName}</span>
            <TempBadge value={l.temperature} />
            <StatusBadge value={l.status} />
            <span className="font-semibold">{formatCurrency(l.quotedPrice)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
