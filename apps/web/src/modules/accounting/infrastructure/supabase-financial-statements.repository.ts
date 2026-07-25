import { supabase } from "@shared/lib/supabase";
import type { IncomeStatement, StatementFilters, IFinancialStatementsRepository } from "@accounting/domain/financial-statements.types";

// El RPC devuelve la estructura ya en camelCase (period/revenue/cogs/opex/nonop/summary).
export const supabaseFinancialStatementsRepository: IFinancialStatementsRepository = {
  async getIncomeStatement(f: StatementFilters): Promise<IncomeStatement | null> {
    const { data } = await supabase.rpc("get_income_statement", { p_year: f.year, p_month_from: f.monthFrom, p_month_to: f.monthTo });
    const d = data as (IncomeStatement & { error?: string }) | null;
    return d && !d.error ? d : null;
  },
};
