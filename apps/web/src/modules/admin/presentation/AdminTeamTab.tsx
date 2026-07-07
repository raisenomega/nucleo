import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { TeamList, ROLES } from "@admin/presentation/TeamList";
import type { TeamMember, AppRole, UserStatus, InviteData, RepoResult } from "@admin/domain/admin.types";

export function AdminTeamTab({ team, onInvite, onStatus, onRole }: {
  team: readonly TeamMember[];
  onInvite: (d: InviteData) => Promise<RepoResult>;
  onStatus: (id: string, s: UserStatus) => Promise<RepoResult>;
  onRole: (uid: string, role: AppRole) => Promise<RepoResult>;
}) {
  const { t } = useI18n();
  const [inv, setInv] = useState<InviteData>({ email: "", fullName: "", role: "servicio" });
  const field = "rounded-lg border border-border bg-background p-2 text-sm";
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
      <TeamList team={team} onStatus={onStatus} onRole={onRole} />
    </div>
  );
}
