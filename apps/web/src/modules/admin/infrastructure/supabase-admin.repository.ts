import { supabase } from "@shared/lib/supabase";
import type {
  IAdminRepository, TeamMember, CategoryConfig, SettingEntry, RepoResult, AppRole, UserStatus,
} from "@admin/domain/admin.types";

const ok = (error: { message: string } | null): RepoResult => (error ? { ok: false, error: error.message } : { ok: true });

export const supabaseAdminRepository: IAdminRepository = {
  async listTeam(): Promise<readonly TeamMember[]> {
    const [p, r] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name,status"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const roleOf = new Map(((r.data as { user_id: string; role: AppRole }[] | null) ?? []).map((x) => [x.user_id, x.role]));
    return ((p.data as { id: string; email: string; full_name: string; status: UserStatus }[] | null) ?? [])
      .map((x) => ({ id: x.id, email: x.email, fullName: x.full_name, role: roleOf.get(x.id) ?? null, status: x.status }));
  },
  async setStatus(id, status): Promise<RepoResult> {
    return ok((await supabase.from("profiles").update({ status }).eq("id", id)).error);
  },
  async changeRole(userId, role): Promise<RepoResult> {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    return ok((await supabase.from("user_roles").insert({ user_id: userId, role })).error);
  },
  async invite(d): Promise<RepoResult> {
    return ok((await supabase.from("allowed_emails").insert({ email: d.email.toLowerCase(), full_name: d.fullName, role: d.role })).error);
  },
  async listCategories(): Promise<readonly CategoryConfig[]> {
    const { data } = await supabase.from("categories").select("id,kind,label,expense_class,active").order("kind").order("sort");
    return ((data as { id: string; kind: string; label: string; expense_class: string | null; active: boolean }[] | null) ?? [])
      .map((c) => ({ id: c.id, kind: c.kind, label: c.label, expenseClass: c.expense_class, active: c.active }));
  },
  async saveCategory(id, kind, label, expenseClass): Promise<RepoResult> {
    const row = { label, expense_class: expenseClass };
    return ok((id
      ? await supabase.from("categories").update(row).eq("id", id)
      : await supabase.from("categories").insert({ kind, sort: 99, ...row })).error);
  },
  async toggleCategory(id, active): Promise<RepoResult> {
    return ok((await supabase.from("categories").update({ active }).eq("id", id)).error);
  },
  async listSettings(): Promise<readonly SettingEntry[]> {
    const { data } = await supabase.from("settings").select("key,value");
    return ((data as { key: string; value: unknown }[] | null) ?? []).map((s) => ({ key: s.key, value: String(s.value) }));
  },
  async upsertSetting(key, value): Promise<RepoResult> {
    return ok((await supabase.from("settings").upsert({ key, value }, { onConflict: "tenant_id,key" })).error);
  },
};
