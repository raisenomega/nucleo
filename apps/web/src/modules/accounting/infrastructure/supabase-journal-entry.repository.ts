import { supabase } from "@shared/lib/supabase";
import type { JournalEntry, JournalEntryLine, AccountBalance, JournalFilters, IJournalEntryRepository, SourceType, EntryStatus } from "@accounting/domain/journal-entry.types";

const SELECT = "id, entry_number, entry_date, description, entry_type, source_type, source_id, status, period_year, period_month, is_closing_entry, void_reason, posted_at, created_at, lines:journal_entry_lines(id, account_id, debit, credit, description, account:chart_of_accounts(account_code, account_name, account_type))";
type Row = Record<string, unknown>;

function toLine(r: Row): JournalEntryLine {
  const a = r.account as { account_code?: string; account_name?: string; account_type?: string } | null;
  return { id: r.id as string, accountId: r.account_id as string, accountCode: a?.account_code ?? "", accountName: a?.account_name ?? "",
    accountType: a?.account_type ?? "", debit: Number(r.debit), credit: Number(r.credit), description: (r.description as string | null) ?? null };
}
function toEntry(r: Row): JournalEntry {
  const lines = ((r.lines as Row[] | null) ?? []).map(toLine).sort((a, b) => (b.debit - a.debit) || a.accountCode.localeCompare(b.accountCode));
  return { id: r.id as string, entryNumber: r.entry_number as string, entryDate: r.entry_date as string, description: r.description as string,
    entryType: r.entry_type as "manual" | "auto", sourceType: (r.source_type as SourceType | null) ?? null, sourceId: (r.source_id as string | null) ?? null,
    status: r.status as EntryStatus, periodYear: Number(r.period_year), periodMonth: Number(r.period_month), isClosingEntry: r.is_closing_entry as boolean,
    lines, totalDebit: lines.reduce((s, l) => s + l.debit, 0), totalCredit: lines.reduce((s, l) => s + l.credit, 0),
    voidReason: (r.void_reason as string | null) ?? null, postedAt: (r.posted_at as string | null) ?? null, createdAt: r.created_at as string };
}

export const journalRepository: IJournalEntryRepository = {
  async list(f: JournalFilters): Promise<JournalEntry[]> {
    let ids: string[] | null = null;
    if (f.accountId) {
      const { data } = await supabase.from("journal_entry_lines").select("entry_id").eq("account_id", f.accountId);
      ids = [...new Set(((data as { entry_id: string }[] | null) ?? []).map((x) => x.entry_id))];
      if (ids.length === 0) return [];
    }
    let q = supabase.from("journal_entries").select(SELECT).eq("period_year", f.periodYear).order("entry_date", { ascending: false }).order("entry_number", { ascending: false });
    if (f.periodMonth != null) q = q.eq("period_month", f.periodMonth);
    if (f.sourceType) q = q.eq("source_type", f.sourceType);
    if (f.status) q = q.eq("status", f.status);
    if (ids) q = q.in("id", ids);
    const s = f.search.trim();
    if (s) q = q.or(`description.ilike.%${s}%,entry_number.ilike.%${s}%`);
    const { data } = await q;
    return ((data as Row[] | null) ?? []).map(toEntry);
  },
  async trialBalance(year: number, month: number | null) {
    const { data, error } = await supabase.rpc("get_trial_balance", { p_year: year, p_month: month });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, value: ((data as Row[] | null) ?? []).map((r) => ({ accountId: r.account_id as string, accountCode: r.account_code as string, accountName: r.account_name as string,
      accountType: r.account_type as string, normalBalance: r.normal_balance as string, totalDebit: Number(r.total_debit), totalCredit: Number(r.total_credit), balance: Number(r.balance) })) };
  },
};
