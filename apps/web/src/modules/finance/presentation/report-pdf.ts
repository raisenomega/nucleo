import type { ReportSeries, EmployeePerformance } from "@finance/domain/report.types";

// Construye el body de POST /pdf/report (title/kpis/tables) desde el snapshot del tab activo.
type Cell = string | number;
export interface ReportPdfBody {
  title: string; date_from: string; date_to: string;
  kpis: { label: string; value: string }[];
  tables: { title: string; headers: string[]; rows: Cell[][] }[];
  charts: never[];
}

const $ = (n: number) => `$${n.toFixed(2)}`;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function buildReportBody(tab: string, s: ReportSeries, emp: EmployeePerformance[], from: string, to: string, title: string): ReportPdfBody {
  const base = { title, date_from: from, date_to: to, charts: [] as never[] };
  if (tab === "sales") {
    return { ...base,
      kpis: [
        { label: "Ingresos", value: $(sum(s.months.map((m) => m.income))) },
        { label: "Leads nuevos", value: String(sum(s.months.map((m) => m.leads_new))) },
        { label: "Convertidos", value: String(sum(s.months.map((m) => m.leads_converted))) }],
      tables: [
        { title: "Top clientes", headers: ["Cliente", "Total", "Servicios"],
          rows: s.top_clients.map((c) => [c.name, $(c.total), c.count]) },
        { title: "Leads por fuente", headers: ["Fuente", "Leads", "Convertidos", "CAC"],
          rows: s.leads_by_source.map((l) => [l.source, l.count, l.converted, $(l.cac)]) }] };
  }
  if (tab === "employees") {
    return { ...base,
      kpis: [
        { label: "Paradas", value: String(sum(emp.map((e) => e.stops))) },
        { label: "Completadas", value: String(sum(emp.map((e) => e.completed))) },
        { label: "Cobrado", value: $(sum(emp.map((e) => e.incomeCollected))) }],
      tables: [{ title: "Rendimiento por empleado",
        headers: ["Empleado", "Paradas", "Completadas", "No atendidas", "% cobro", "Cobrado", "Costo laboral"],
        rows: emp.map((e) => [e.name, e.stops, e.completed, e.notAttended, `${e.collectionRate}%`, $(e.incomeCollected), $(e.laborCost)]) }] };
  }
  if (tab === "marketing") {
    return { ...base, kpis: [
        { label: "Presupuesto", value: $(sum(s.marketing_by_channel.map((c) => c.budget))) },
        { label: "Ejecutado", value: $(sum(s.marketing_by_channel.map((c) => c.spent))) }],
      tables: [{ title: "Por canal", headers: ["Canal", "Presupuesto", "Gastado", "Leads", "Convertidos", "Revenue"],
        rows: s.marketing_by_channel.map((c) => [c.channel, $(c.budget), $(c.spent), c.leads, c.converted, $(c.revenue)]) }] };
  }
  const inc = sum(s.months.map((m) => m.income)), exp = sum(s.months.map((m) => m.expense));
  return { ...base,
    kpis: [{ label: "Ingresos", value: $(inc) }, { label: "Gastos", value: $(exp) }, { label: "Balance", value: $(inc - exp) }],
    tables: [
      { title: "Por mes", headers: ["Mes", "Ingresos", "Gastos", "Nómina", "Balance", "Margen %"],
        rows: s.months.map((m) => [m.month, $(m.income), $(m.expense), $(m.payroll), $(m.balance), `${m.margin_pct}%`]) },
      { title: "Gastos por categoría", headers: ["Categoría", "Total"],
        rows: s.expenses_by_category.map((c) => [c.category, $(c.total)]) }] };
}
