import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { supabase } from "@shared/lib/supabase";
import type { TeamMember, AppRole, UserStatus, RepoResult } from "@admin/domain/admin.types";

export const ROLES: { v: AppRole; l: string }[] = [
  { v: "ceo", l: "CEO" }, { v: "coo", l: "COO" }, { v: "operaciones", l: "Operaciones" }, { v: "servicio", l: "Servicio" },
];
const REQUIRED = ["i9", "w4", "contract", "background_check", "drug_test", "medical_cert"];
const notify = (p: Promise<RepoResult>) => void p.then((r) => window.alert(r.ok ? "Guardado exitoso" : r.error));

// Lista de equipo: tabla en desktop, cards en mobile. Helpers compartidos entre ambos renders.
export function TeamList({ team, onStatus, onRole }: {
  team: readonly TeamMember[]; onStatus: (id: string, s: UserStatus) => Promise<RepoResult>; onRole: (uid: string, role: AppRole) => Promise<RepoResult>;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [docMap, setDocMap] = useState<Record<string, Set<string>>>({});
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  useEffect(() => { void supabase.from("employee_documents").select("profile_id, doc_type").then(({ data }) => {
    const map: Record<string, Set<string>> = {};
    for (const d of (data as { profile_id: string; doc_type: string }[] | null) ?? []) (map[d.profile_id] ??= new Set()).add(d.doc_type);
    setDocMap(map);
  }); }, []);
  const docs = (id: string) => `${REQUIRED.filter((r) => docMap[id]?.has(r)).length}/${REQUIRED.length}`;
  const name = (m: TeamMember) => <button type="button" onClick={() => void navigate({ to: "/settings-team/$userId", params: { userId: m.id } })} className="font-semibold text-primary hover:underline">{m.fullName}</button>;
  const roleSel = (m: TeamMember) => <select value={m.role ?? ""} onChange={(e) => void onRole(m.id, e.target.value as AppRole)} className={fld}>{ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}</select>;
  const acts = (m: TeamMember) => <div className="flex gap-4 text-xs font-bold">
    {m.status !== "approved" && <button type="button" onClick={() => notify(onStatus(m.id, "approved"))} className="text-green-600">{t("approve")}</button>}
    {m.status !== "rejected" && <button type="button" onClick={() => notify(onStatus(m.id, "rejected"))} className="text-destructive">{t("deactivate")}</button>}</div>;
  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className="px-3 py-2 text-left">{t("contactName")}</th><th className="px-3 py-2 text-left">{t("email")}</th>
            <th className="px-3 py-2 text-left">{t("role")}</th><th className="px-3 py-2 text-left">{t("status")}</th>
            <th className="px-3 py-2 text-center">{t("documents")}</th><th className="px-3 py-2 text-right">{t("actions")}</th>
          </tr></thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-3 py-2">{name(m)}</td><td className="px-3 py-2">{m.email}</td>
                <td className="px-3 py-2">{roleSel(m)}</td><td className="px-3 py-2">{m.status}</td>
                <td className="px-3 py-2 text-center">{docs(m.id)}</td>
                <td className="px-3 py-2"><div className="flex justify-end">{acts(m)}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2 md:hidden">
        {team.map((m) => (
          <div key={m.id} className="space-y-2 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2 text-base">{name(m)}<span className="text-xs text-muted-foreground">{m.status} · {docs(m.id)}</span></div>
            <p className="text-sm text-muted-foreground">{m.email}</p>
            {roleSel(m)}{acts(m)}
          </div>
        ))}
      </div>
    </>
  );
}
