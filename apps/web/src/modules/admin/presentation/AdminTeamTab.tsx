import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { supabase } from "@shared/lib/supabase";
import type { TeamMember, AppRole, UserStatus, InviteData, RepoResult } from "@admin/domain/admin.types";

const ROLES: { v: AppRole; l: string }[] = [
  { v: "ceo", l: "CEO" }, { v: "coo", l: "COO" }, { v: "operaciones", l: "Operaciones" }, { v: "servicio", l: "Servicio" },
];
const REQUIRED = ["i9", "w4", "contract", "background_check", "drug_test", "medical_cert"];

export function AdminTeamTab({ team, onInvite, onStatus, onRole }: {
  team: readonly TeamMember[];
  onInvite: (d: InviteData) => Promise<RepoResult>;
  onStatus: (id: string, s: UserStatus) => Promise<RepoResult>;
  onRole: (uid: string, role: AppRole) => Promise<RepoResult>;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [inv, setInv] = useState<InviteData>({ email: "", fullName: "", role: "servicio" });
  const [docMap, setDocMap] = useState<Record<string, Set<string>>>({});
  const field = "rounded-lg border border-border bg-background p-2 text-sm";
  useEffect(() => { void supabase.from("employee_documents").select("profile_id, doc_type").then(({ data }) => {
    const m: Record<string, Set<string>> = {};
    for (const d of (data as { profile_id: string; doc_type: string }[] | null) ?? []) (m[d.profile_id] ??= new Set()).add(d.doc_type);
    setDocMap(m);
  }); }, []);
  const docCount = (id: string) => REQUIRED.filter((r) => docMap[id]?.has(r)).length;
  async function invite() {
    const r = await onInvite(inv);
    if (!r.ok) window.alert(r.error); else setInv({ email: "", fullName: "", role: "servicio" });
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-card p-4">
        <input value={inv.fullName} onChange={(e) => setInv({ ...inv, fullName: e.target.value })} placeholder={t("contactName")} className={field} />
        <input type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} placeholder="email@dominio.com" className={field} />
        <select value={inv.role} onChange={(e) => setInv({ ...inv, role: e.target.value as AppRole })} className={field}>
          {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
        </select>
        <button type="button" onClick={() => void invite()} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">{t("inviteEmployee")}</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className="px-3 py-2 text-left">{t("contactName")}</th><th className="px-3 py-2 text-left">{t("email")}</th>
            <th className="px-3 py-2 text-left">{t("role")}</th><th className="px-3 py-2 text-left">{t("status")}</th>
            <th className="px-3 py-2 text-center">{t("documents")}</th><th className="px-3 py-2 text-right">{t("actions")}</th>
          </tr></thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-3 py-2"><button type="button" onClick={() => void navigate({ to: "/settings-team/$userId", params: { userId: m.id } })} className="cursor-pointer font-semibold text-primary hover:underline">{m.fullName}</button></td>
                <td className="px-3 py-2">{m.email}</td>
                <td className="px-3 py-2">
                  <select value={m.role ?? ""} onChange={(e) => void onRole(m.id, e.target.value as AppRole)} className={field}>
                    {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">{m.status}</td>
                <td className="px-3 py-2 text-center">{docCount(m.id)}/{REQUIRED.length} {docCount(m.id) === REQUIRED.length ? "✅" : "⚠️"}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2 text-xs font-bold">
                    {m.status !== "approved" && <button type="button" onClick={() => void onStatus(m.id, "approved")} className="text-green-600">{t("approve")}</button>}
                    {m.status !== "rejected" && <button type="button" onClick={() => void onStatus(m.id, "rejected")} className="text-destructive">{t("deactivate")}</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
