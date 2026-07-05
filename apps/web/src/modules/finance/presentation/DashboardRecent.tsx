import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { RecentItem, Snapshot } from "@finance/domain/dashboard.types";

function RecentList({ title, items, empty }: { title: string; items: readonly RecentItem[]; empty: string }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border p-4 font-body font-bold">{title}</div>
      <ul className="divide-y divide-border">
        {items.length === 0 && <li className="p-4 font-body text-sm text-muted-foreground">{empty}</li>}
        {items.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-2 p-3 font-body text-sm">
            <span className="text-muted-foreground">{r.date}</span>
            <span className="flex-1 truncate">{r.category ?? "—"}</span>
            <span className="font-semibold">{formatCurrency(r.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DashboardRecent({ s }: { s: Snapshot }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <RecentList title={t("recentIncome")} items={s.recentIncome} empty={t("noData")} />
      <RecentList title={t("recentExpenses")} items={s.recentExpenses} empty={t("noData")} />
    </div>
  );
}
