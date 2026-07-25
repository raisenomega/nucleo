import { supabase } from "@shared/lib/supabase";
import type { Result } from "@accounting/domain/chart-of-accounts.types";

// Acciones de escritura del GL (todas gated is_ceo_or_above en backend): asientos manuales, apertura, cierre fiscal.
export type FiscalYear = { readonly year: number; readonly closed: boolean };
export type ManualLine = { account_id: string; debit: number; credit: number; description: string | null };
export type OpeningBalance = { account_code: string; debit: number; credit: number };

const OK: Result<null, string> = { ok: true, value: null };
function fail(e: { message?: string } | null): Result<never, string> { return { ok: false, error: e?.message ?? "Error" }; }

export const accountingActionsRepository = {
  async createManualEntry(date: string, description: string, lines: ManualLine[]): Promise<Result<string, string>> {
    const { data, error } = await supabase.rpc("create_manual_entry", { p_date: date, p_description: description, p_lines: lines });
    return error ? fail(error) : { ok: true, value: data as string };
  },
  async postEntry(id: string): Promise<Result<null, string>> {
    const { error } = await supabase.rpc("post_journal_entry", { p_entry_id: id });
    return error ? fail(error) : OK;
  },
  async voidEntry(id: string, reason: string): Promise<Result<null, string>> {
    const { error } = await supabase.rpc("void_journal_entry", { p_entry_id: id, p_reason: reason });
    return error ? fail(error) : OK;
  },
  async deleteEntry(id: string): Promise<Result<null, string>> {
    const { error } = await supabase.rpc("delete_journal_entry", { p_entry_id: id });
    return error ? fail(error) : OK;
  },
  async closeFiscalYear(year: number): Promise<Result<string, string>> {
    const { data, error } = await supabase.rpc("close_fiscal_year", { p_year: year });
    return error ? fail(error) : { ok: true, value: data as string };
  },
  async reopenFiscalYear(year: number): Promise<Result<null, string>> {
    const { error } = await supabase.rpc("reopen_fiscal_year", { p_year: year });
    return error ? fail(error) : OK;
  },
  async createOpeningEntry(balances: OpeningBalance[]): Promise<Result<string, string>> {
    const { data, error } = await supabase.rpc("create_opening_entry", { p_balances: balances });
    return error ? fail(error) : { ok: true, value: data as string };
  },
  async fiscalYears(): Promise<FiscalYear[]> {
    const { data } = await supabase.from("journal_entries").select("period_year, is_closing_entry, status").neq("status", "voided");
    const rows = (data as { period_year: number; is_closing_entry: boolean; status: string }[] | null) ?? [];
    const map = new Map<number, boolean>();
    for (const r of rows) map.set(r.period_year, (map.get(r.period_year) ?? false) || (r.is_closing_entry && r.status === "posted"));
    return [...map.entries()].map(([year, closed]) => ({ year, closed })).sort((a, b) => b.year - a.year);
  },
  async hasOpening(): Promise<boolean> {
    const { count } = await supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("source_type", "opening").neq("status", "voided");
    return (count ?? 0) > 0;
  },
};
