import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@shared/i18n";
import type { Budget, MarketingExpense } from "@crm/domain/marketing.types";

export function MarketingChart({ budgets, expenses, channels }: {
  budgets: readonly Budget[]; expenses: readonly MarketingExpense[]; channels: readonly string[];
}) {
  const { t } = useI18n();
  const data = channels.map((ch) => ({
    channel: ch,
    budget: budgets.filter((b) => b.channel === ch).reduce((s, b) => s + b.budgetedAmount, 0),
    spent: expenses.filter((e) => e.channel === ch).reduce((s, e) => s + e.amount, 0),
  })).filter((d) => d.budget > 0 || d.spent > 0);
  if (data.length === 0) {
    return <div className="rounded-lg border border-border bg-card p-6 text-center font-body text-sm text-muted-foreground">{t("noData")}</div>;
  }
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="budget" name={t("budgetedAmount")} fill="hsl(217 91% 60%)" />
          <Bar dataKey="spent" name={t("spent")} fill="hsl(142 71% 45%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
