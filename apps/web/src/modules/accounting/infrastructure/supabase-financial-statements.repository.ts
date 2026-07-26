import { supabase } from "@shared/lib/supabase";
import type { IncomeStatement, BalanceSheet, CashFlowStatement, StatementFilters, IFinancialStatementsRepository } from "@accounting/domain/financial-statements.types";

// Los RPCs devuelven la estructura ya en camelCase.
export const supabaseFinancialStatementsRepository: IFinancialStatementsRepository = {
  async getIncomeStatement(f: StatementFilters): Promise<IncomeStatement | null> {
    const { data } = await supabase.rpc("get_income_statement", { p_year: f.year, p_month_from: f.monthFrom, p_month_to: f.monthTo });
    const d = data as (IncomeStatement & { error?: string }) | null;
    return d && !d.error ? d : null;
  },
  async getBalanceSheet(asOfDate: string): Promise<BalanceSheet | null> {
    const { data } = await supabase.rpc("get_balance_sheet", { p_as_of_date: asOfDate });
    const d = data as (BalanceSheet & { error?: string }) | null;
    return d && !d.error ? d : null;
  },
  async getCashFlow(f: StatementFilters): Promise<CashFlowStatement | null> {
    const { data } = await supabase.rpc("get_cash_flow_statement", { p_year: f.year, p_month_from: f.monthFrom, p_month_to: f.monthTo });
    const d = data as (CashFlowStatement & { error?: string }) | null;
    return d && !d.error ? d : null;
  },
};
