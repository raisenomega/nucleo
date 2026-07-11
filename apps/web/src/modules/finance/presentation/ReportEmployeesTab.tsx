import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ReportChart } from "@finance/presentation/ReportChart";
import { ReportBars } from "@finance/presentation/ReportBars";
import type { EmployeePerformance } from "@finance/domain/report.types";

export function ReportEmployeesTab({ emp }: { emp: EmployeePerformance[] }) {
  const { t } = useI18n();
  const perf = emp.map((e) => ({ name: e.name, completed: e.completed, notAttended: e.notAttended }));
  const prod = emp.map((e) => ({ name: e.name, collected: e.incomeCollected }));
  const top = [...emp].sort((a, b) => b.incomeCollected - a.incomeCollected)[0];
  const legend = top ? `El empleado más productivo es ${top.name} con ${formatCurrency(top.incomeCollected)} cobrados.` : "";
  const bars = [{ key: "completed", name: t("rCompleted"), color: "hsl(142 71% 45%)" }, { key: "notAttended", name: t("notAttended"), color: "hsl(0 72% 51%)" }];
  return (
    <div className="space-y-4">
      <ReportChart title={t("rPerformance")}><ReportBars data={perf} xKey="name" bars={bars} /></ReportChart>
      <ReportChart title={t("rProductivity")} legend={legend}>
        <ReportBars data={prod} xKey="name" bars={[{ key: "collected", name: t("collect"), color: "hsl(38 85% 55%)" }]} />
      </ReportChart>
      <ReportChart title={t("rLaborCost")}>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("employee")}</th><th className="p-2 text-right">{t("rLaborCost")}</th>
          <th className="p-2 text-right">{t("collect")}</th><th className="p-2 text-right">{t("collectionRate")}</th></tr></thead>
          <tbody>{emp.map((e) => (<tr key={e.employeeId} className="border-b border-border">
            <td className="p-2">{e.name}</td><td className="p-2 text-right">{formatCurrency(e.laborCost)}</td>
            <td className="p-2 text-right font-bold text-primary">{formatCurrency(e.incomeCollected)}</td>
            <td className="p-2 text-right">{e.collectionRate}%</td></tr>))}</tbody></table></div>
      </ReportChart>
    </div>
  );
}
