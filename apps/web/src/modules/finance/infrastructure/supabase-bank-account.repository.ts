import { supabase } from "@shared/lib/supabase";
import type {
  BankAccount, BankAccountFormData, IBankAccountRepository, RepoResult,
} from "@finance/domain/bank-account.types";

interface Row {
  id: string; tenant_id: string; bank_name: string; account_last4: string | null;
  account_type: "checking" | "savings"; is_primary: boolean; active: boolean;
}
const SELECT = "id, tenant_id, bank_name, account_last4, account_type, is_primary, active";

function toEntity(r: Row): BankAccount {
  return { id: r.id, tenantId: r.tenant_id, bankName: r.bank_name, accountLast4: r.account_last4 ?? "",
    accountType: r.account_type, isPrimary: r.is_primary, active: r.active };
}
function toRow(d: BankAccountFormData) {
  return { bank_name: d.bankName, account_last4: d.accountLast4 || null, account_type: d.accountType, is_primary: d.isPrimary };
}

export const supabaseBankAccountRepository: IBankAccountRepository = {
  async list(): Promise<readonly BankAccount[]> {
    const { data } = await supabase.from("bank_accounts").select(SELECT).eq("active", true).order("bank_name");
    return ((data as unknown as Row[] | null) ?? []).map(toEntity);
  },
  async create(d): Promise<RepoResult> {
    const { error } = await supabase.from("bank_accounts").insert(toRow(d));
    return error ? { ok: false, error: error.message } : { ok: true };
  },
  async update(id, d): Promise<RepoResult> {
    const { error } = await supabase.from("bank_accounts").update(toRow(d)).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  },
  async remove(id): Promise<RepoResult> {
    const { error } = await supabase.from("bank_accounts").update({ active: false }).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true };
  },
};
