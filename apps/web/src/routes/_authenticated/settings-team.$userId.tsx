import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { useTeamMember } from "@admin/application/useTeamMember.hook";
import { supabaseAdminRepository } from "@admin/infrastructure/supabase-admin.repository";
import { ProfilePersonalSection } from "@admin/presentation/ProfilePersonalSection";
import { ProfileRoleSection } from "@admin/presentation/ProfileRoleSection";

export const Route = createFileRoute("/_authenticated/settings-team/$userId")({ component: MemberPage });

function MemberPage() {
  const { t } = useI18n();
  const { canEdit } = useRoleGate();
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const m = useTeamMember(supabaseAdminRepository, userId);
  const [form, setForm] = useState({ fullName: "", phone: "", position: "" });
  useEffect(() => { if (m.member) setForm({ fullName: m.member.fullName, phone: m.member.phone, position: m.member.position }); }, [m.member]);

  if (!canEdit("ceo")) return <div className="p-8 text-sm text-muted-foreground">{t("notAuthorized")}</div>;
  if (m.loading || !m.member) return <div className="p-8 text-sm text-muted-foreground">{t("noData")}</div>;
  const active = m.member.status !== "rejected";
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-primary">{t("employeeProfile")}</h1>
        <Link to="/settings" className="text-sm font-bold text-primary">← {t("backToTeam")}</Link>
      </div>
      <ProfilePersonalSection member={m.member} form={form} onChange={(k, v) => setForm({ ...form, [k]: v })} canEdit />
      <ProfileRoleSection member={m.member} canEdit onRole={(r) => void m.changeRole(r)} onPin={(p) => void m.setPin(p)} />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void m.save(form)} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">{t("save")}</button>
        {active
          ? <button type="button" onClick={() => { if (window.confirm(`${t("deactivate")}?`)) void m.setStatus("rejected"); }} className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-primary-foreground">{t("deactivate")}</button>
          : <button type="button" onClick={() => void m.setStatus("approved")} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white">{t("reactivate")}</button>}
        <button type="button" onClick={() => void navigate({ to: "/settings" })} className="rounded-lg bg-secondary text-foreground px-4 py-2 text-sm font-body">{t("backToTeam")}</button>
      </div>
    </div>
  );
}
