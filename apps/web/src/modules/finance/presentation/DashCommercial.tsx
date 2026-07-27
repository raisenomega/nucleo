import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { KpiCard } from "@finance/presentation/KpiCard";
import type { DashData } from "@finance/application/useDashboard.hook";
import type { Aging } from "@finance/domain/dashboard.types";

// Banda Comercial: AR + AP (aging) + Clientes + CRM. Cada card navega a su módulo.
const overdue = (a: Aging | null) => (a ? a.b1_30 + a.b31_60 + a.b61_90 + a.b90_plus : 0);

export function DashCommercial({ d, glEnabled }: { d: DashData; glEnabled: boolean }) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {d.ar && <Link to="/accounts-receivable"><KpiCard label={t("totalReceivable")} value={formatCurrency(d.ar.total)} sub={overdue(d.ar) > 0 ? `${formatCurrency(overdue(d.ar))} ${t("overdue")}` : undefined} /></Link>}
      {glEnabled && d.ap && <Link to="/accounting/payables"><KpiCard label={t("totalPayable")} value={formatCurrency(d.ap.total)} sub={overdue(d.ap) > 0 ? `${formatCurrency(overdue(d.ap))} ${t("overdue")}` : undefined} /></Link>}
      {d.ops && <Link to="/customers" search={{}}><KpiCard label={t("activeClients")} value={`${d.ops.customersActive}`} sub={`${d.ops.customersDebt} ${t("cWithDebt")}`} /></Link>}
      {d.ops && <KpiCard label={t("newClients")} value={`${d.ops.customersNew}`} />}
      {d.crm && <Link to="/leads"><KpiCard label={t("leads")} value={`${d.crm.totalLeads}`} sub={`${d.crm.conversionRate.toFixed(0)}% conv.`} /></Link>}
    </div>
  );
}
