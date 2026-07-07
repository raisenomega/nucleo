import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { useSession } from "@shared/providers/SessionProvider";
import { useTeamMember } from "@admin/application/useTeamMember.hook";
import { useEmployeeDetail } from "@admin/application/useEmployeeDetail.hook";
import { supabaseAdminRepository } from "@admin/infrastructure/supabase-admin.repository";
import { supabaseEmployeeDetailRepository } from "@admin/infrastructure/supabase-employee-detail.repository";
import { supabaseEmployeeDocsRepository } from "@admin/infrastructure/supabase-employee-docs.repository";
import { ProfilePersonalTab } from "@admin/presentation/ProfilePersonalTab";
import { ProfileProfessionalTab } from "@admin/presentation/ProfileProfessionalTab";
import { ProfileAccessTab } from "@admin/presentation/ProfileAccessTab";
import { ProfileBenefitsTab } from "@admin/presentation/ProfileBenefitsTab";
import { ProfileHealthTab } from "@admin/presentation/ProfileHealthTab";
import { ProfileCertifications } from "@admin/presentation/ProfileCertifications";
import { ProfileDocumentsTab } from "@admin/presentation/ProfileDocumentsTab";
import type { EmployeeDetailUpdate } from "@admin/domain/employee-detail.types";
import type { TranslationKey } from "@shared/i18n";

export const Route = createFileRoute("/_authenticated/settings-team/$userId")({ component: MemberPage });
const TABS: { id: string; k: TranslationKey }[] = [
  { id: "personal", k: "personalTab" }, { id: "professional", k: "professionalTab" }, { id: "access", k: "accessTab" },
  { id: "benefits", k: "benefitsTab" }, { id: "health", k: "healthTab" }, { id: "documents", k: "documentsTab" },
];
async function notify(p: Promise<{ ok: boolean; error?: string }>) { const r = await p; window.alert(r.ok ? "Guardado exitoso" : r.error ?? ""); }

function MemberPage() {
  const { t } = useI18n();
  const { canEdit } = useRoleGate();
  const { session } = useSession();
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const tm = useTeamMember(supabaseAdminRepository, userId);
  const ed = useEmployeeDetail(supabaseEmployeeDetailRepository, supabaseEmployeeDocsRepository, userId);
  const [form, setForm] = useState<EmployeeDetailUpdate>({});
  const [tab, setTab] = useState("personal");
  useEffect(() => { if (ed.detail) setForm({ ...ed.detail }); }, [ed.detail]);
  const set = <K extends keyof EmployeeDetailUpdate>(k: K, v: EmployeeDetailUpdate[K]) => setForm((f) => ({ ...f, [k]: v }));

  if (!canEdit("ceo")) return <div className="p-8 text-sm text-muted-foreground">{t("notAuthorized")}</div>;
  if (tm.loading || !tm.member) return <div className="p-8 text-sm text-muted-foreground">{t("noData")}</div>;
  const m = tm.member, active = m.status !== "rejected";
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">{m.fullName.charAt(0)}</span>
          <div><h1 className="font-display text-2xl font-bold text-primary">{m.fullName}</h1>
            <p className="text-xs text-muted-foreground">{m.role ?? "—"} · {m.email} · {m.phone || "—"}</p></div>
        </div>
        <Link to="/settings" className="text-sm font-bold text-primary">← {t("backToTeam")}</Link>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((x) => <button key={x.id} type="button" onClick={() => setTab(x.id)} className={`px-3 py-2 text-sm font-bold ${tab === x.id ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{t(x.k)}</button>)}
      </div>
      {tab === "personal" && <ProfilePersonalTab form={form} set={set} />}
      {tab === "professional" && <ProfileProfessionalTab form={form} set={set} />}
      {tab === "access" && <ProfileAccessTab role={m.role} onRole={(r) => void tm.changeRole(r)} onPin={(p) => void notify(tm.setPin(p))} form={form} set={set} />}
      {tab === "benefits" && <ProfileBenefitsTab form={form} set={set} />}
      {tab === "health" && <div className="space-y-4"><ProfileHealthTab form={form} set={set} />
        <ProfileCertifications certs={ed.certs} onAdd={(c) => void ed.addCert(c)} onUpdate={(id, c) => void ed.updateCert(id, c)} onRemove={(id) => void ed.removeCert(id)} /></div>}
      {tab === "documents" && <ProfileDocumentsTab docs={ed.docs} onUpload={(f, ty, dt, n) => void ed.uploadDoc(session?.tenantId ?? "", f, ty, dt, n)} onRemove={(id, url) => void ed.removeDoc(id, url)} />}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void notify(ed.saveDetail(form))} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">{t("save")}</button>
        {active
          ? <button type="button" onClick={() => { if (window.confirm(`${t("deactivate")}?`)) void notify(tm.setStatus("rejected")); }} className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-primary-foreground">{t("deactivate")}</button>
          : <button type="button" onClick={() => void notify(tm.setStatus("approved"))} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white">{t("reactivate")}</button>}
        <button type="button" onClick={() => void navigate({ to: "/settings" })} className="rounded-lg bg-secondary text-foreground px-4 py-2 text-sm font-body">{t("backToTeam")}</button>
      </div>
    </div>
  );
}
