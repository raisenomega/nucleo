import { supabase } from "@shared/lib/supabase";
import type { IReportRepository, ReportSeries, EmployeePerformance } from "@finance/domain/report.types";

const EMPTY: ReportSeries = {
  months: [], top_clients: [], top_employees: [], expenses_by_category: [], income_by_category: [],
  leads_by_source: [], leads_by_status: [], payroll_by_employee: [], marketing_by_channel: [],
};

export const supabaseReportRepository: IReportRepository = {
  async getSeries(from, to) {
    const { data, error } = await supabase.rpc("get_report_series", { p_from: from, p_to: to });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, value: (data as ReportSeries | null) ?? EMPTY };
  },
  async getEmployeePerformance(from, to) {
    const { data, error } = await supabase.rpc("get_employee_performance", { p_from: from, p_to: to });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, value: (data as EmployeePerformance[] | null) ?? [] };
  },
};
