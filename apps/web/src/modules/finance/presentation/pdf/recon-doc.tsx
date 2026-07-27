import type { ReactElement } from "react";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { ReconciliationSnapshot } from "@finance/domain/reconciliation.types";
import type { ReconSection } from "@shared/pdf/ReconciliationPdf";

type T = (k: TranslationKey) => string;
const $ = (n: number) => `$${(n ?? 0).toFixed(2)}`;

// Reporte fiscal → ReconciliationPdf. Arma las 6 secciones desde el snapshot que el front ya construyó.
export async function reconDoc(month: string, s: ReconciliationSnapshot, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { ReconciliationPdf } = await import("@shared/pdf/ReconciliationPdf");
  const { bank, tax, retention, summary } = s; const h = summary.health;
  const sections: ReconSection[] = [
    { kind: "kpi", kpis: [{ label: t("income"), value: $(summary.totalIncome) }, { label: t("expenses"), value: $(summary.totalExpenses) },
      { label: t("operatingProfit"), value: $(summary.operatingProfit) }, { label: t("availableBalance"), value: $(summary.availableBalance) }] },
    { kind: "table", title: t("bankBalance"), headers: [t("bankName"), t("openingBalance"), t("deposits"), t("realBalance"), t("difference")],
      rows: bank.accounts.map((a) => [a.bankName, $(a.openingBalance), $(a.deposits), $(a.realBalance), $(a.difference)]) },
    { kind: "table", title: t("taxObligations"), headers: [t("obligation"), t("estimated"), t("frequencyLabel")],
      rows: tax.obligations.map((o) => [o.label, $(o.estimated), o.frequency]) },
    { kind: "table", title: `${t("retentionFund")} (${retention.retentionPct}%)`, headers: [t("month"), t("income"), t("retentionAuto"), t("accumulated")],
      rows: retention.monthly.map((m) => [String(m.month), $(m.income), $(m.retention), $(m.accumulated)]) },
    { kind: "kpi", kpis: [{ label: t("breakEven"), value: $(h.breakEven) }, { label: t("operatingMargin"), value: `${h.operatingMargin.toFixed(1)}%` },
      { label: h.surplus > 0 ? t("surplus") : t("shortfall"), value: $(h.surplus > 0 ? h.surplus : h.shortfall) }] },
    ...(summary.expenseBreakdown.length ? [{ kind: "table" as const, title: t("expensesByCategory"),
      headers: [t("category"), t("amount")], rows: summary.expenseBreakdown.map((e) => [e.category, $(e.amount)]) }] : []),
  ];
  return <ReconciliationPdf data={{ title: `${t("fiscalReport")} ${month}`, sections }} brand={brand} />;
}
