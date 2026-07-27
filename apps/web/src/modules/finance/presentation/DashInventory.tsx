import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { KpiCard } from "@finance/presentation/KpiCard";
import type { DashData } from "@finance/application/useDashboard.hook";

// Banda Inventario: valor / bajo stock / por vencer / COGS + top 5 consumidos (barra horizontal).
export function DashInventory({ d }: { d: DashData }) {
  const { t } = useI18n();
  const i = d.inv;
  if (!i) return null;
  const top = i.topConsumed.map((x) => ({ name: x.name.length > 18 ? `${x.name.slice(0, 18)}…` : x.name, qty: x.qty }));
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="grid grid-cols-2 gap-3">
        <Link to="/inventory"><KpiCard label={t("inventoryValue")} value={formatCurrency(i.totalValue)} sub={`${i.totalItems} ${t("totalItems")}`} /></Link>
        <KpiCard label={t("lowStock")} value={`${i.lowStock}`} />
        <KpiCard label={t("expiringLots")} value={`${i.expiringLots}`} />
        <KpiCard label={t("cogsMonth")} value={formatCurrency(i.cogsMonth)} />
      </div>
      {top.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">{t("chartTopConsumed")}</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={top} layout="vertical" margin={{ left: 8, right: 8 }}>
              <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
              <Tooltip /><Bar dataKey="qty" fill="royalblue" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
