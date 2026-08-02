import { useCallback, useEffect, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { stmtErr } from "@accounting/presentation/statement-error";
import { useToast } from "@shared/providers/toast-context";
import { formatCurrency } from "@shared/lib/format";
import { accountingActionsRepository as repo, type FiscalYear } from "@accounting/infrastructure/supabase-accounting-actions.repository";
import { supabaseFinancialStatementsRepository as fs } from "@accounting/infrastructure/supabase-financial-statements.repository";

// Cierre/reapertura anual. Cerrar transfiere la utilidad neta a 3300 (Utilidades Retenidas). Solo años terminados.
export function FiscalYearClose() {
  const { t } = useI18n(); const toast = useToast();
  const [years, setYears] = useState<FiscalYear[]>([]);
  const nowYear = new Date().getFullYear();
  const load = useCallback(async () => setYears(await repo.fiscalYears()), []);
  useEffect(() => { void load(); }, [load]);
  const close = async (y: number) => {
    const is = await fs.getIncomeStatement({ year: y, monthFrom: 1, monthTo: 12 });
    // Sin estado de resultados NO se ofrece cerrar: antes mostraba «$0.00» —cifra plausible para un anio sin
    // actividad— y el CEO aprobaba el cierre del anio fiscal sobre un dato falso (auditoria E2E §13).
    if (!is.ok) { toast.error(stmtErr(is.error, t)); return; }
    const net = is.value.summary.netIncome;
    if (!window.confirm(`${t("closeYearConfirm")} ${y}\n${t("netIncomeToClose")}: ${formatCurrency(net)}`)) return;
    const r = await repo.closeFiscalYear(y);
    if (r.ok) { toast.success(t("fiscalYearClosed")); void load(); } else toast.error(r.error);
  };
  const reopen = async (y: number) => {
    if (!window.confirm(`${t("reopenConfirm")} ${y}`)) return;
    const r = await repo.reopenFiscalYear(y);
    if (r.ok) { toast.success(t("fiscalYearOpen")); void load(); } else toast.error(r.error);
  };
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div><h2 className="font-display text-lg font-bold text-foreground">{t("annualClose")}</h2>
        <p className="text-xs text-muted-foreground">{t("transferToRetained")}</p></div>
      {years.length === 0 ? <p className="text-sm text-muted-foreground">{t("noDataForPeriod")}</p> : (
        <div className="space-y-2">{years.map((fy) => (
          <div key={fy.year} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
            <span className="font-bold text-foreground">{t("fiscalYear")} {fy.year}
              <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${fy.closed ? "bg-muted text-muted-foreground" : "bg-green-500/15 text-green-600"}`}>{fy.closed ? t("fiscalYearClosed") : t("fiscalYearOpen")}</span></span>
            {fy.closed ? (
              <button type="button" onClick={() => void reopen(fy.year)} className="flex items-center gap-1 rounded px-2 py-1 text-xs font-bold text-primary"><Unlock className="h-3.5 w-3.5" />{t("reopenFiscalYear")}</button>
            ) : fy.year < nowYear ? (
              <button type="button" onClick={() => void close(fy.year)} className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground"><Lock className="h-3.5 w-3.5" />{t("closeFiscalYear")}</button>
            ) : <span className="text-xs text-muted-foreground">{t("yearNotEnded")}</span>}
          </div>
        ))}</div>
      )}
    </div>
  );
}
