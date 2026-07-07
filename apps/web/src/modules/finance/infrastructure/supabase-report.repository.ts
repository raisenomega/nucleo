import { supabase } from "@shared/lib/supabase";
import type { IReportRepository, ReportSeries, EmployeePerformance } from "@finance/domain/report.types";

const EMPTY: ReportSeries = {
  months: [], top_clients: [], top_employees: [], expenses_by_category: [], income_by_category: [],
  leads_by_source: [], leads_by_status: [], payroll_by_employee: [], marketing_by_channel: [],
};

export const supabaseReportRepository: IReportRepository = {
  async getSeries(from, to) {
    const { data } = await supabase.rpc("get_report_series", { p_from: from, p_to: to });
    return (data as ReportSeries | null) ?? EMPTY;
  },
  async getEmployeePerformance(from, to) {
    const { data } = await supabase.rpc("get_employee_performance", { p_from: from, p_to: to });
    return (data as EmployeePerformance[] | null) ?? [];
  },
};
