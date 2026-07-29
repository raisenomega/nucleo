import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { DashData } from "@finance/application/useDashboard.hook";
import { KpiCard } from "@finance/presentation/KpiCard";
import { DashAgingBar } from "@finance/presentation/DashAgingBar";
import { DashList } from "@finance/presentation/DashList";

// Vista profunda Cartera: AR/AP + aging (barras coloreadas) + top deudores.
export function DashboardCartera({ d }: { d: DashData }) {
  const { t } = useI18n();
  const ar = d.ar, ap = d.ap;
  const net = (ar?.total ?? 0) - (ap?.total ?? 0);
  const debtors = (ar?.byCustomer ?? []).map((c) => ({ label: c.name, value: formatCurrency(c.outstanding) }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label={t("totalReceivable")} value={formatCurrency(ar?.total ?? 0)} />
        <KpiCard label={t("totalPayable")} value={formatCurrency(ap?.total ?? 0)} />
        <KpiCard label={t("netBalance")} value={formatCurrency(net)} />
        <KpiCard label={t("activeClients")} value={`${d.ops?.customersActive ?? 0}`} sub={`${d.ops?.customersDebt ?? 0} ${t("cWithDebt")}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ar && <DashAgingBar title={t("arAging")} aging={ar} emptyMessage={t("chartNoAr")} />}
        {ap && <DashAgingBar title={t("apAging")} aging={ap} emptyMessage={t("chartNoAp")} />}
      </div>
      <DashList title={t("topDebtors")} rows={debtors} />
    </div>
  );
}
