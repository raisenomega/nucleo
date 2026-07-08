import type { Income } from "@finance/domain/income.types";
import type { Expense } from "@finance/domain/expense.types";
import type { ExtraPayment } from "@finance/domain/extraordinary.types";
import type { Payroll } from "@finance/domain/payroll.types";

// Builders del body de /pdf/report para reportes con rango de fechas (headers en español, como el resto de PDFs).
const $ = (n: number) => `$${n.toFixed(2)}`;
const range = <T>(rows: readonly T[], date: (r: T) => string, from: string, to: string): T[] =>
  rows.filter((r) => (!from || date(r) >= from) && (!to || date(r) <= to));
const body = (title: string, from: string, to: string, headers: string[], rows: (string | number)[][], kpis: { label: string; value: string }[]) =>
  ({ title, date_from: from, date_to: to, kpis, tables: rows.length ? [{ title, headers, rows }] : [], charts: [] as never[] });
const totalKpis = (n: number, sum: number) => [{ label: "Registros", value: String(n) }, { label: "Total", value: $(sum) }];

export function incomeReportBody(rows: readonly Income[], from: string, to: string) {
  const r = range(rows, (x) => x.date, from, to);
  return body("Ingresos", from, to, ["Fecha", "Categoría", "Monto", "Método", "Cliente"],
    r.map((x) => [x.date, x.categoryLabel, $(x.amount), x.paymentMethodLabel, x.clientReference || "—"]),
    totalKpis(r.length, r.reduce((s, x) => s + x.amount, 0)));
}
export function expenseReportBody(rows: readonly Expense[], from: string, to: string) {
  const r = range(rows, (x) => x.date, from, to);
  return body("Gastos", from, to, ["Fecha", "Categoría", "Monto", "Método"],
    r.map((x) => [x.date, x.categoryLabel, $(x.amount), x.paymentMethodLabel]),
    totalKpis(r.length, r.reduce((s, x) => s + x.amount, 0)));
}
export function extraordinaryReportBody(rows: readonly ExtraPayment[], from: string, to: string) {
  const r = range(rows, (x) => x.date, from, to);
  return body("Extraordinarios", from, to, ["Fecha", "Categoría", "Monto", "Justificación"],
    r.map((x) => [x.date, x.categoryLabel, $(x.amount), x.justification]),
    totalKpis(r.length, r.reduce((s, x) => s + x.amount, 0)));
}
export function payrollReportBody(rows: readonly Payroll[], from: string, to: string) {
  const r = range(rows, (x) => x.date, from, to);
  return body("Nómina", from, to, ["Fecha", "Empleado", "Periodo", "Monto", "Método"],
    r.map((x) => [x.date, x.employeeName, x.period, $(x.amount), x.paymentMethodLabel]),
    totalKpis(r.length, r.reduce((s, x) => s + x.amount, 0)));
}
