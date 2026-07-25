import { supabase } from "@shared/lib/supabase";
import { NORMAL_BALANCE, type ChartAccount, type AccountFormData, type IChartOfAccountsRepository, type Result, type AccountType } from "@accounting/domain/chart-of-accounts.types";

const SELECT = "id, tenant_id, account_code, account_name, account_type, parent_id, is_header, normal_balance, is_system, description, active, parent:chart_of_accounts!parent_id(account_name)";
type Row = Record<string, unknown>;
const s = (v: unknown) => (v as string | null) ?? null;

function toAccount(r: Row): ChartAccount {
  return {
    id: r.id as string, tenantId: r.tenant_id as string, accountCode: r.account_code as string, accountName: r.account_name as string,
    accountType: r.account_type as AccountType, parentId: s(r.parent_id), parentName: ((r.parent as { account_name?: string } | null)?.account_name) ?? null,
    isHeader: r.is_header as boolean, normalBalance: r.normal_balance as "debit" | "credit", isSystem: r.is_system as boolean,
    description: s(r.description), active: r.active as boolean,
  };
}
const toRow = (d: AccountFormData) => ({
  account_code: d.accountCode.trim(), account_name: d.accountName.trim(), account_type: d.accountType,
  parent_id: d.parentId, is_header: d.isHeader, normal_balance: NORMAL_BALANCE[d.accountType], description: d.description || null,
});

export const supabaseChartOfAccountsRepository: IChartOfAccountsRepository = {
  async list(): Promise<ChartAccount[]> {
    const { data } = await supabase.from("chart_of_accounts").select(SELECT).order("account_code");
    return ((data as Row[] | null) ?? []).map(toAccount);
  },
  async create(d): Promise<Result<ChartAccount, string>> {
    const { data, error } = await supabase.from("chart_of_accounts").insert(toRow(d)).select(SELECT).single();
    return error ? { ok: false, error: error.message } : { ok: true, value: toAccount(data as Row) };
  },
  async update(id, d): Promise<Result<ChartAccount, string>> {
    const patch: Record<string, unknown> = {};
    if (d.accountName != null) patch.account_name = d.accountName.trim();
    if (d.accountType != null) { patch.account_type = d.accountType; patch.normal_balance = NORMAL_BALANCE[d.accountType]; }
    if (d.parentId !== undefined) patch.parent_id = d.parentId;
    if (d.isHeader != null) patch.is_header = d.isHeader;
    if (d.description !== undefined) patch.description = d.description || null;
    const { data, error } = await supabase.from("chart_of_accounts").update(patch).eq("id", id).select(SELECT).single();
    return error ? { ok: false, error: error.message } : { ok: true, value: toAccount(data as Row) };
  },
  async toggleActive(id, active): Promise<Result<null, string>> {
    const { error } = await supabase.from("chart_of_accounts").update({ active }).eq("id", id);
    return error ? { ok: false, error: error.message } : { ok: true, value: null };
  },
};
