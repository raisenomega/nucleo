import { Wallet, Scale, Users, Home } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { FiscalSnapshot } from "@finance/domain/dashboard.types";

const COLOR = { surplus: "text-green-600", tight: "text-yellow-600", deficit: "text-red-600" } as const;
const EMOJI = { surplus: "🟢", tight: "🟡", deficit: "🔴" } as const;

export function DashboardFiscal({ f }: { f: FiscalSnapshot }) {
  const { t } = useI18n();
  const color = COLOR[f.operatingStatus];
  const paidPct = f.recurringBudgeted > 0 ? Math.round((f.recurringPaid / f.recurringBudgeted) * 100) : (f.recurringPaid > 0 ? 100 : 0);
  const fixColor = f.recurringBudgeted === 0 ? "" : f.recurringPaid >= f.recurringBudgeted ? "text-green-600" : f.recurringPaid > 0 ? "text-yellow-600" : "text-red-600";
  const card = "space-y-2 rounded-lg border border-border bg-card p-5";
  const lbl = "flex items-center gap-2 text-xs text-muted-foreground";
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className={card}>
        <div className={lbl}><Wallet className="h-4 w-4 text-primary" /> {t("availableBalance")}</div>
        <div className={`text-2xl font-black md:text-3xl ${color}`}>{formatCurrency(f.availableBalance)}</div>
        <div className={`text-xl ${color}`}>{EMOJI[f.operatingStatus]}</div>
      </div>
      <div className={card}>
        <div className={lbl}><Scale className="h-4 w-4 text-primary" /> {t("breakEven")}</div>
        <div className="flex items-baseline gap-2"><span className="text-2xl font-black md:text-3xl">{f.breakEvenPct}%</span>
          <span className="text-xs text-muted-foreground">{t("breakEvenProgress")}</span></div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${Math.min(100, f.breakEvenPct)}%` }} /></div>
        <div className="text-xs font-bold">
          {f.surplus > 0 ? <span className="text-green-600">{t("surplus")}: {formatCurrency(f.surplus)}</span>
            : <span className="text-red-600">{t("shortfall")}: {formatCurrency(f.shortfall)}</span>}
        </div>
      </div>
      <div className={card}>
        <div className={lbl}><Users className="h-4 w-4 text-primary" /> {t("payrollCost")}</div>
        <div className="text-2xl font-black md:text-3xl">{formatCurrency(f.payrollCost)}</div>
        <div className="text-xs text-muted-foreground">{t("employerCost")}</div>
      </div>
      <div className={card}>
        <div className={lbl}><Home className="h-4 w-4 text-primary" /> {t("fixedCosts")}</div>
        <div className={`text-2xl font-black md:text-3xl ${fixColor}`}>{formatCurrency(f.recurringBudgeted)}</div>
        <div className="text-xs text-muted-foreground">{t("paid")}: {formatCurrency(f.recurringPaid)} ({paidPct}%)</div>
      </div>
    </div>
  );
}
