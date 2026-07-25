import { CheckCircle2, XCircle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { BalanceSheet, BSAccount } from "@accounting/domain/financial-statements.types";

const fmt = (n: number) => (n < 0 ? `(${formatCurrency(Math.abs(n))})` : formatCurrency(n));

// Balance General con formato contable: subsecciones corriente/no corriente, subtotales y check de cuadre.
export function BalanceSheetReport({ bs }: { bs: BalanceSheet }) {
  const { t } = useI18n();
  const s = bs.summary;
  const acct = (a: BSAccount) => (
    <div key={a.code} className="flex justify-between gap-4 pl-4 text-sm">
      <span className="text-muted-foreground"><span className="font-mono text-xs">{a.code}</span> {a.name}{a.isComputed && <span className="ml-1 text-[10px] text-amber-600">({t("unclosed")})</span>}</span>
      <span className="font-mono">{fmt(a.balance)}</span>
    </div>
  );
  const sub = (label: string, accts: readonly BSAccount[], total: number) => accts.length > 0 && (
    <div className="space-y-0.5">
      <div className="text-xs font-bold text-muted-foreground">{label}</div>
      {accts.map(acct)}
      <div className="flex justify-between gap-4 border-t border-border pt-0.5 text-sm font-semibold"><span className="pl-4 text-muted-foreground">{t("total")} {label}</span><span className="font-mono">{fmt(total)}</span></div>
    </div>
  );
  const total = (label: string, amount: number, strong?: boolean) => (
    <div className={`flex justify-between gap-4 ${strong ? "border-y-2" : "border-t-2"} border-foreground py-1.5 font-bold`}><span>{label}</span><span className="font-mono">{fmt(amount)}</span></div>
  );
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4 md:p-6">
      <div className="text-xs font-bold uppercase text-muted-foreground">{t("assets")}</div>
      {sub(t("currentAssets"), bs.assetsCurrent, bs.assetsCurrentTotal)}
      {sub(t("nonCurrentAssets"), bs.assetsNonCurrent, bs.assetsNonCurrentTotal)}
      {total(t("totalAssets"), s.totalAssets)}
      <div className="pt-2 text-xs font-bold uppercase text-muted-foreground">{t("liabilities")}</div>
      {sub(t("currentLiabilities"), bs.liabCurrent, bs.liabCurrentTotal)}
      {sub(t("longTermLiabilities"), bs.liabLongTerm, bs.liabLongTermTotal)}
      {total(t("totalLiabilities"), s.totalLiabilities)}
      <div className="pt-2 text-xs font-bold uppercase text-muted-foreground">{t("equity")}</div>
      {bs.equity.map(acct)}
      {total(t("totalEquity"), s.totalEquity)}
      {total(t("totalLiabilitiesEquity"), s.totalLiabilitiesEquity, true)}
      <div className={`flex items-center gap-2 rounded-lg p-2 text-sm font-bold ${s.isBalanced ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
        {s.isBalanced ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {s.isBalanced ? t("balanced") : `${t("unbalanced")}: ${fmt(s.difference)}`}
      </div>
    </div>
  );
}
