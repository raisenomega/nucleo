import type { ReconciliationSnapshot } from "@finance/domain/reconciliation.types";

// Body de POST /pdf/report para el reporte fiscal mensual de conciliación.
const $ = (n: number) => `$${n.toFixed(2)}`;

export function buildFiscalBody(month: string, s: ReconciliationSnapshot, title: string) {
  const sum = s.summary, b = s.bank;
  return {
    title: `${title} — ${month}`,
    date_from: `${month}-01`,
    date_to: month,
    kpis: [
      { label: "Ingresos", value: $(sum.totalIncome) },
      { label: "Gastos", value: $(sum.totalExpenses) },
      { label: "Ganancia operativa", value: $(sum.operatingProfit) },
      { label: "Balance disponible", value: $(sum.availableBalance) },
    ],
    tables: [
      { title: "Resumen ejecutivo", headers: ["Concepto", "Monto"], rows: [
        ["Ingresos", $(sum.totalIncome)], ["Gastos", $(sum.totalExpenses)], ["Nómina", $(sum.totalPayroll)],
        ["Extraordinarios", $(sum.totalExtraordinary)], ["Marketing", $(sum.totalMarketing)],
        ["Ganancia operativa", $(sum.operatingProfit)], ["Impuesto estimado", $(sum.taxEstimated)],
        ["Retención requerida", $(sum.retentionRequired)], ["Balance disponible", $(sum.availableBalance)]] },
      { title: "Banco", headers: ["Concepto", "Monto"], rows: [
        ["Balance inicial", $(b.openingBalance)], ["Depósitos", $(b.deposits)], ["Egresos", $(b.egresos)],
        ["Balance calculado", $(b.calculatedBalance)], ["Balance real", $(b.realBalance)], ["Diferencia", $(b.difference)]] },
      { title: "Retención", headers: ["Concepto", "Valor"], rows: [
        ["% retención", `${s.retention.retentionPct}%`], ["Requerido", $(s.retention.required)]] },
    ],
    charts: [] as never[],
  };
}
