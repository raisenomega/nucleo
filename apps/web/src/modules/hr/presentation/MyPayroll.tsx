import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@shared/i18n";
import { supabasePortalRepository } from "@hr/infrastructure/supabase-portal.repository";
import { MyPayrollDetail } from "@hr/presentation/MyPayrollDetail";
import type { MyPayStub } from "@hr/domain/portal.types";

// Mis recibos de pago (RLS payroll self). Resumen anual + detalle. Sin costo patronal.
export function MyPayroll({ employeeName }: { employeeName: string }) {
  const { t } = useI18n();
  const [stubs, setStubs] = useState<MyPayStub[]>([]);
  const [view, setView] = useState<MyPayStub | null>(null);
  useEffect(() => { void supabasePortalRepository.payroll().then(setStubs); }, []);
  const money = (n: number) => `$${n.toFixed(2)}`;
  const year = new Date().getFullYear().toString();
  const ann = useMemo(() => stubs.filter((s) => s.date.startsWith(year))
    .reduce((a, s) => ({ gross: a.gross + s.gross, net: a.net + s.net }), { gross: 0, net: 0 }), [stubs, year]);
  const kpi = (label: string, val: string) => (
    <div className="rounded-xl border border-border bg-card p-4"><span className="text-xs font-bold uppercase text-muted-foreground">{label}</span><p className="text-xl font-bold text-foreground">{val}</p></div>);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3"><span className="col-span-2 text-xs font-bold text-muted-foreground">{t("annualSummary")} {year}</span>
        {kpi(t("annualGross"), money(ann.gross))}{kpi(t("annualNet"), money(ann.net))}</div>
      {stubs.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRecords")}</p> : (
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="p-2">{t("period")}</th><th className="p-2">{t("date")}</th><th className="p-2">{t("grossSalary")}</th>
            <th className="p-2">{t("netSalary")}</th><th className="p-2"></th></tr></thead>
          <tbody>{stubs.map((s) => (
            <tr key={s.id} className="border-b border-border">
              <td className="p-2 font-semibold">{s.period}</td><td className="p-2">{s.date}</td><td className="p-2">{money(s.gross)}</td>
              <td className="p-2 font-bold">{money(s.net)}</td>
              <td className="p-2 text-right"><button type="button" onClick={() => setView(s)} className="text-xs font-bold text-primary">{t("view")}</button></td></tr>))}</tbody>
        </table>)}
      {view && <MyPayrollDetail stub={view} employeeName={employeeName} onClose={() => setView(null)} />}
    </div>
  );
}
