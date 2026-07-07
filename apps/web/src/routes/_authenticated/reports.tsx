import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useReports, type Period } from "@finance/application/useReports.hook";
import { supabaseReportRepository } from "@finance/infrastructure/supabase-report.repository";
import { ReportSalesTab } from "@finance/presentation/ReportSalesTab";
import { ReportEmployeesTab } from "@finance/presentation/ReportEmployeesTab";
import { ReportFinancialTab } from "@finance/presentation/ReportFinancialTab";
import { ReportMarketingTab } from "@finance/presentation/ReportMarketingTab";

export const Route = createFileRoute("/_authenticated/reports")({ component: ReportsPage });
const PERIODS: { id: Period; k: TranslationKey }[] = [
  { id: "month", k: "pMonth" }, { id: "q", k: "p3m" }, { id: "half", k: "p6m" }, { id: "year", k: "pYear" }];

function ReportsPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const m = useReports(supabaseReportRepository);
  const [tab, setTab] = useState("sales");
  if (!can("reports", "view")) return <Navigate to="/dashboard" />;
  const fin = can("income", "view") || can("expenses", "view");
  const tabs: { id: string; k: TranslationKey }[] = [
    ...(fin ? [{ id: "sales", k: "pillarSales" as TranslationKey }] : []),
    { id: "employees", k: "pillarEmployees" },
    ...(fin ? [{ id: "financial", k: "pillarFinancial" as TranslationKey }] : []),
    ...(fin && can("marketing", "view") ? [{ id: "marketing", k: "pillarMarketing" as TranslationKey }] : []),
  ];
  const active = tabs.some((x) => x.id === tab) ? tab : (tabs[0]?.id ?? "employees");
  const s = m.series;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-primary md:text-3xl">{t("reports")}</h1>
          <div className="flex gap-1 overflow-x-auto">{PERIODS.map((p) => (
            <button key={p.id} type="button" onClick={() => m.setPeriod(p.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold ${m.period === p.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{t(p.k)}</button>))}</div>
        </div>
        <p className="text-xs text-muted-foreground">{t("reportsSubtitle")}</p>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border">{tabs.map((x) => (
        <button key={x.id} type="button" onClick={() => setTab(x.id)}
          className={`px-3 py-2 text-sm font-bold ${active === x.id ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{t(x.k)}</button>))}</div>
      {!s ? <p className="text-sm text-muted-foreground">{t("noData")}</p> : (
        <>{active === "sales" && <ReportSalesTab s={s} />}
          {active === "employees" && <ReportEmployeesTab emp={m.employees} />}
          {active === "financial" && <ReportFinancialTab s={s} />}
          {active === "marketing" && <ReportMarketingTab s={s} />}</>
      )}
    </div>
  );
}
