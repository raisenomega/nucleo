import { supabase } from "@shared/lib/supabase";
import type {
  ColumnMap, ImportBatch, ImportResult, ParsedLine, StatementLine, StatementLineFilters,
} from "@finance/domain/bank-statement.types";

interface LineRow { id: string; txn_date: string; description: string | null; amount: number; running_balance: number | null; external_ref: string | null; match_status: string; import_batch_id: string }
interface BatchRow { id: string; file_name: string | null; row_count: number; date_from: string | null; date_to: string | null; created_at: string }
const num = (v: unknown) => (v == null ? null : Number(v));
const toLine = (r: LineRow): StatementLine => ({ id: r.id, txnDate: r.txn_date, description: r.description ?? "", amount: Number(r.amount), runningBalance: num(r.running_balance), externalRef: r.external_ref, matchStatus: r.match_status as StatementLine["matchStatus"], batchId: r.import_batch_id });
const toBatch = (r: BatchRow): ImportBatch => ({ id: r.id, fileName: r.file_name ?? "—", rowCount: r.row_count, dateFrom: r.date_from, dateTo: r.date_to, createdAt: r.created_at });
function nextMonth(m: string): string { const p = m.split("-").map(Number); const y = p[0] ?? 0, mo = p[1] ?? 1; return mo === 12 ? `${y + 1}-01-01` : `${y}-${String(mo + 1).padStart(2, "0")}-01`; }

export const supabaseBankStatementRepository = {
  async importStatement(bankAccountId: string, fileName: string, columnMap: ColumnMap, lines: ParsedLine[]): Promise<{ ok: true; result: ImportResult } | { ok: false; error: string }> {
    const { data, error } = await supabase.rpc("import_bank_statement", { _payload: { bank_account_id: bankAccountId, file_name: fileName, column_map: columnMap, lines } });
    if (error) return { ok: false, error: error.message };
    const d = (data as Record<string, unknown>) ?? {};
    return { ok: true, result: { batchId: (d.batch_id as string) ?? null, inserted: Number(d.inserted ?? 0), skippedDuplicates: Number(d.skipped_duplicates ?? 0) } };
  },
  async listLines(f: StatementLineFilters): Promise<StatementLine[]> {
    let q = supabase.from("bank_statement_lines").select("id, txn_date, description, amount, running_balance, external_ref, match_status, import_batch_id").order("txn_date", { ascending: false });
    if (f.bankAccountId) q = q.eq("bank_account_id", f.bankAccountId);
    if (f.status && f.status !== "all") q = q.eq("match_status", f.status);
    if (f.month) q = q.gte("txn_date", `${f.month}-01`).lt("txn_date", nextMonth(f.month));
    const { data } = await q;
    return ((data as unknown as LineRow[] | null) ?? []).map(toLine);
  },
  async listBatches(bankAccountId?: string): Promise<ImportBatch[]> {
    let q = supabase.from("bank_import_batches").select("id, file_name, row_count, date_from, date_to, created_at").order("created_at", { ascending: false });
    if (bankAccountId) q = q.eq("bank_account_id", bankAccountId);
    const { data } = await q;
    return ((data as unknown as BatchRow[] | null) ?? []).map(toBatch);
  },
  async lastColumnMap(bankAccountId: string): Promise<ColumnMap | null> {
    const { data } = await supabase.from("bank_import_batches").select("column_map").eq("bank_account_id", bankAccountId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    return ((data?.column_map as ColumnMap) ?? null);
  },
  async deleteBatch(id: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from("bank_import_batches").delete().eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  },
};
