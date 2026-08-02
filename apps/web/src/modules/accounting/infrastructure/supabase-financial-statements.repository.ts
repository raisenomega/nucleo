import { supabase } from "@shared/lib/supabase";
import type { IncomeStatement, BalanceSheet, CashFlowStatement, StatementFilters, IFinancialStatementsRepository } from "@accounting/domain/financial-statements.types";

// Los RPCs devuelven la estructura ya en camelCase.
export const supabaseFinancialStatementsRepository: IFinancialStatementsRepository = {
  async getIncomeStatement(f: StatementFilters) {
    const { data, error } = await supabase.rpc("get_income_statement", { p_year: f.year, p_month_from: f.monthFrom, p_month_to: f.monthTo });
    const d = data as (IncomeStatement & { error?: string }) | null;
    if (error || !d || d.error) return { ok: false as const, error: error?.message ?? d?.error ?? "Sin datos del servidor" };
    return { ok: true as const, value: d };
  },
  async getBalanceSheet(asOfDate: string) {
    const { data, error } = await supabase.rpc("get_balance_sheet", { p_as_of_date: asOfDate });
    const d = data as (BalanceSheet & { error?: string }) | null;
    if (error || !d || d.error) return { ok: false as const, error: error?.message ?? d?.error ?? "Sin datos del servidor" };
    return { ok: true as const, value: d };
  },
  // Esta NO devuelve {error} como sus dos hermanas: lanza NOT_AUTHORIZED. El chequeo de `d.error` que habia
  // aqui era codigo muerto; el fallo viaja por `error` de la RPC.
  async getCashFlow(f: StatementFilters) {
    const { data, error } = await supabase.rpc("get_cash_flow_statement", { p_year: f.year, p_month_from: f.monthFrom, p_month_to: f.monthTo });
    if (error || !data) return { ok: false as const, error: error?.message ?? "Sin datos del servidor" };
    return { ok: true as const, value: data as CashFlowStatement };
  },
};
