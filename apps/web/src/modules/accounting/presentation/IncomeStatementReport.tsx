import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { IncomeStatement, StatementAccount } from "@accounting/domain/financial-statements.types";

const money = (n: number) => formatCurrency(Math.abs(n));
const paren = (n: number) => `(${money(n)})`;

// Estado de Resultados con formato contable: cuentas indentadas, subtotales, líneas de utilidad resaltadas.
export function IncomeStatementReport({ st }: { st: IncomeStatement }) {
  const { t } = useI18n();
  const s = st.summary;
  const acct = (a: StatementAccount, cost: boolean) => (
    <div key={a.code} className="flex justify-between gap-4 pl-4 text-sm">
      <span className="text-muted-foreground"><span className="font-mono text-xs">{a.code}</span> {a.name}</span>
      <span className="font-mono">{cost ? paren(a.amount) : money(a.amount)}</span>
    </div>
  );
  const section = (label: string, accts: readonly StatementAccount[], cost: boolean, totalLabel: string, total: number) => accts.length > 0 && (
    <div className="space-y-0.5">
      <div className="text-xs font-bold uppercase text-muted-foreground">{label}</div>
      {accts.map((a) => acct(a, cost))}
      <div className="flex justify-between gap-4 border-t border-border pt-1 text-sm font-bold"><span>{totalLabel}</span><span className="font-mono">{cost ? paren(total) : money(total)}</span></div>
    </div>
  );
  const profit = (label: string, amount: number, pct: number, strong: boolean) => (
    <div className={`flex justify-between gap-4 ${strong ? "border-y-2" : "border-t-2"} border-foreground py-1.5 font-bold ${amount < 0 ? "text-destructive" : strong ? "text-green-600" : "text-foreground"}`}>
      <span>{label} <span className="text-xs font-normal text-muted-foreground">({pct.toFixed(1)}%)</span></span>
      <span className="font-mono">{amount < 0 ? paren(amount) : money(amount)}</span>
    </div>
  );
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 md:p-6">
      {section(t("revenue"), st.revenue, false, t("totalRevenue"), s.totalRevenue)}
      {section(t("costOfSales"), st.cogs, true, t("totalCogs"), s.totalCogs)}
      {profit(t("grossProfit"), s.grossProfit, s.grossMarginPct, false)}
      {section(t("operatingExpenses"), st.opex, true, t("totalOpex"), s.totalOpex)}
      {profit(t("operatingIncome"), s.operatingIncome, s.operatingMarginPct, false)}
      {st.nonop.length > 0 && section(t("nonOperatingExpenses"), st.nonop, true, t("totalNonOp"), s.totalNonOp)}
      {profit(t("netIncome"), s.netIncome, s.netMarginPct, true)}
    </div>
  );
}
