import { supabase } from "@shared/lib/supabase";
import type { MatchEntry, Suggestion, UnmatchedEntry } from "@finance/domain/bank-statement.types";

type Res = { ok: true } | { ok: false; error: string };
type J = Record<string, unknown>;
const jarr = (v: unknown) => (Array.isArray(v) ? v : []) as J[];
async function rpc(fn: string, args: J): Promise<Res> {
  const { error } = await supabase.rpc(fn, args);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export const supabaseBankMatchRepository = {
  async suggest(bankAccountId: string, month: string): Promise<Suggestion[]> {
    const { data } = await supabase.rpc("suggest_matches", { _bank_account_id: bankAccountId, _month: `${month}-01` });
    return jarr(data).map((r) => {
      const ln = (r.line as J) ?? {};
      return {
        lineId: r.line_id as string,
        line: { txnDate: ln.txn_date as string, description: (ln.description as string) ?? "", amount: Number(ln.amount) },
        candidates: jarr(r.candidates).map((c) => ({ entryType: c.entry_type as "income" | "expense", entryId: c.entry_id as string, amount: Number(c.amount), date: c.date as string, description: (c.description as string) ?? "", score: Number(c.score) })),
      };
    });
  },
  async listUnmatchedEntries(month: string, type: "income" | "expense"): Promise<UnmatchedEntry[]> {
    const { data } = await supabase.rpc("list_unmatched_entries", { _month: `${month}-01`, _type: type });
    return jarr(data).map((r) => ({ entryId: r.entry_id as string, amount: Number(r.amount), date: r.date as string, description: (r.description as string) ?? "" }));
  },
  confirm: (lineId: string, entries: MatchEntry[]): Promise<Res> => rpc("confirm_match", { _line_id: lineId, _entries: entries.map((e) => ({ entry_type: e.entryType, entry_id: e.entryId, amount: e.amount })) }),
  unmatch: (lineId: string): Promise<Res> => rpc("unmatch_line", { _line_id: lineId }),
  ignore: (lineId: string, reason: string): Promise<Res> => rpc("ignore_line", { _line_id: lineId, _reason: reason }),
  createEntry: (lineId: string, categoryId: string, paymentMethodId: string): Promise<Res> => rpc("create_entry_from_line", { _line_id: lineId, _payload: { category_id: categoryId, payment_method_id: paymentMethodId } }),
};
