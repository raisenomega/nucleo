// BC finance — tipos de reportes (/reports). Puro.
export type MonthPoint = {
  month: string; income: number; expense: number; payroll: number; extraordinary: number;
  marketing_spent: number; marketing_budget: number; leads_new: number; leads_converted: number;
  leads_quoted: number; routes_completed: number; routes_not_attended: number; balance: number; margin_pct: number;
};
export interface NamedTotal { name: string; total: number; count: number; }
export interface TopEmployee { name: string; stops_completed: number; stops_not_attended: number; collected: number; }
export interface CatTotal { category: string; total: number; class?: string | null; }
export interface LeadSource { source: string; count: number; converted: number; cac: number; }
export interface StatusCount { status: string; count: number; }
export interface PayrollEmp { name: string; gross: number; net: number; employer_cost: number; }
export interface MarketingChannel { channel: string; budget: number; spent: number; leads: number; converted: number; revenue: number; }

export interface ReportSeries {
  months: MonthPoint[]; top_clients: NamedTotal[]; top_employees: TopEmployee[];
  expenses_by_category: CatTotal[]; income_by_category: CatTotal[]; leads_by_source: LeadSource[];
  leads_by_status: StatusCount[]; payroll_by_employee: PayrollEmp[]; marketing_by_channel: MarketingChannel[];
}
export interface EmployeePerformance {
  employeeId: string; name: string; completed: number; notAttended: number; stops: number;
  collectionRate: number; incomeCollected: number; suppliesUsed: number; laborCost: number;
}
export interface IReportRepository {
  getSeries(from: string, to: string): Promise<ReportSeries>;
  getEmployeePerformance(from: string, to: string): Promise<EmployeePerformance[]>;
}
