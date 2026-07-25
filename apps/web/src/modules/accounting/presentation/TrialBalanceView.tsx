import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { TYPE_META } from "@accounting/presentation/account-ui";
import type { AccountBalance } from "@accounting/domain/journal-entry.types";
import type { AccountType } from "@accounting/domain/chart-of-accounts.types";

// Balance de comprobación: saldos por cuenta + totales Dr=Cr + resumen por tipo + ecuación contable.
export function TrialBalanceView({ rows }: { rows: readonly AccountBalance[] }) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noEntries")}</p>;
  const dr = rows.reduce((s, r) => s + r.totalDebit, 0), cr = rows.reduce((s, r) => s + r.totalCredit, 0);
  const balanced = Math.abs(dr - cr) < 0.01;
  const byType = (types: string[]) => rows.filter((r) => types.includes(r.accountType)).reduce((s, r) => s + r.balance, 0);
  const A = byType(["asset"]), L = byType(["liability"]), E = byType(["equity"]), R = byType(["revenue"]), X = byType(["expense", "cogs"]);
  const eqOk = Math.abs(A - (L + E + R - X)) < 0.01;
  const th = "px-2 py-1 text-left font-bold", num = "px-2 py-1 text-right";
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
          <th className={th}>{t("accountCode")}</th><th className={th}>{t("accountName")}</th><th className={th}>{t("accountType")}</th><th className={`${th} text-right`}>{t("debit")}</th><th className={`${th} text-right`}>{t("credit")}</th><th className={`${th} text-right`}>{t("balanceCol")}</th>
        </tr></thead>
        <tbody>{rows.map((r) => { const m = TYPE_META[r.accountType as AccountType]; return (
          <tr key={r.accountId} className="border-t border-border">
            <td className="px-2 py-1 font-mono text-xs">{r.accountCode}</td><td className="px-2 py-1">{r.accountName}</td>
            <td className="px-2 py-1"><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${m.cls}`}>{t(m.key)}</span></td>
            <td className={num}>{r.totalDebit > 0 ? formatCurrency(r.totalDebit) : ""}</td><td className={num}>{r.totalCredit > 0 ? formatCurrency(r.totalCredit) : ""}</td>
            <td className={`${num} font-semibold ${r.balance < 0 ? "text-destructive" : ""}`}>{formatCurrency(r.balance)}</td></tr>
        ); })}</tbody>
        <tfoot><tr className="border-t-2 border-border bg-secondary/50 font-bold"><td className="px-2 py-1" colSpan={3}>{t("totals")}</td>
          <td className={num}>{formatCurrency(dr)}</td><td className={num}>{formatCurrency(cr)}</td>
          <td className={num}>{balanced ? "✓" : <span className="text-destructive">{t("unbalanced")}</span>}</td></tr></tfoot>
      </table></div>
      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-3">
          <span>{t("asset")}: <b>{formatCurrency(A)}</b></span><span>{t("liability")}: <b>{formatCurrency(L)}</b></span><span>{t("equity")}: <b>{formatCurrency(E)}</b></span>
          <span>{t("revenue")}: <b>{formatCurrency(R)}</b></span><span>{t("expense")} + COGS: <b>{formatCurrency(X)}</b></span>
        </div>
        <p className={`mt-2 font-bold ${eqOk ? "text-green-600" : "text-destructive"}`}>{t("accountingEquation")}: {eqOk ? `${t("balanced")} ✅` : `${t("unbalanced")} ❌`}</p>
      </div>
    </div>
  );
}
