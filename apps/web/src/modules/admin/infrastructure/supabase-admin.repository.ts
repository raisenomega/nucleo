import { supabase } from "@shared/lib/supabase";
import type {
  IAdminRepository, TeamMember, TeamMemberDetail, TeamMemberUpdate, CategoryConfig, SettingEntry, RepoResult, InviteResult, AppRole, UserStatus,
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
  async getTeamMember(userId): Promise<TeamMemberDetail | null> {
    const { data } = await supabase.from("profiles")
      .select("id,email,full_name,status,phone,position,approved_at,created_at").eq("id", userId).maybeSingle();
    if (!data) return null;
    const p = data as { id: string; email: string; full_name: string; status: UserStatus; phone: string | null; position: string | null; approved_at: string | null; created_at: string };
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    return { id: p.id, email: p.email, fullName: p.full_name, status: p.status, role: (r as { role: AppRole } | null)?.role ?? null,
      phone: p.phone ?? "", position: p.position ?? "", approvedAt: p.approved_at, createdAt: p.created_at };
  },
  async updateTeamMember(userId, d: TeamMemberUpdate): Promise<RepoResult> {
    return ok((await supabase.from("profiles").update({ full_name: d.fullName, phone: d.phone, position: d.position }).eq("id", userId)).error);
  },
  async setPin(userId, pin): Promise<RepoResult> {
    return ok((await supabase.rpc("admin_set_pin", { p_user_id: userId, p_pin: pin })).error);
  },
  async setStatus(id, status): Promise<RepoResult> {
    return ok((await supabase.from("profiles").update({ status }).eq("id", id)).error);
  },
  async changeRole(userId, role): Promise<RepoResult> {
    return ok((await supabase.rpc("change_user_role", { p_user_id: userId, p_role: role })).error);
  },
  // upsert ON CONFLICT DO NOTHING + .select(): re-invitar el mismo email no rompe ni re-dispara el
  // trigger (113); data.length===0 => ignorado por duplicado. PK = (tenant_id, email).
  async invite(d): Promise<InviteResult> {
    const { data, error } = await supabase.from("allowed_emails").upsert(
      { email: d.email.toLowerCase().trim(), full_name: d.fullName.trim(), role: d.role },
      { onConflict: "tenant_id,email", ignoreDuplicates: true },
    ).select();
    if (error) return { ok: false, error: error.message };
    return { ok: true, duplicated: !data || data.length === 0 };
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
  async countCategoryUsage(id): Promise<number> {
    const { data } = await supabase.rpc("_count_category_usage", { p_category_id: id }); return typeof data === "number" ? data : 0;
  },
  async deleteCategory(id): Promise<RepoResult> { return ok((await supabase.from("categories").delete().eq("id", id)).error); },
  async listSettings(): Promise<readonly SettingEntry[]> {
    const { data } = await supabase.from("settings").select("key,value");
    return ((data as { key: string; value: unknown }[] | null) ?? []).map((s) => ({ key: s.key, value: String(s.value) }));
  },
  async upsertSetting(key, value): Promise<RepoResult> {
    return ok((await supabase.from("settings").upsert({ key, value }, { onConflict: "tenant_id,key" })).error);
  },
};
