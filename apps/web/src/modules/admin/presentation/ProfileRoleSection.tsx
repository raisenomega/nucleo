import { useI18n } from "@shared/i18n";
import type { TeamMemberDetail, AppRole } from "@admin/domain/admin.types";

const ROLES: { v: AppRole; l: string }[] = [
  { v: "ceo", l: "CEO" }, { v: "coo", l: "COO" }, { v: "operaciones", l: "Operaciones" }, { v: "servicio", l: "Servicio" },
];
// Descripción de accesos por rol (informativo). i18n futuro.
const MODULES: Record<string, string> = {
  superadmin: "Acceso total",
  ceo: "Todo excepto configuración de plataforma",
  coo: "Operaciones + Finanzas + CRM + Categorías",
  operaciones: "Inventario + Rutas + Gastos (sin precios sensibles)",
  servicio: "Solo lectura en módulos asignados",
};

export function ProfileRoleSection({ member, canEdit, onRole, onPin }: {
  member: TeamMemberDetail; canEdit: boolean; onRole: (role: AppRole) => void; onPin: (pin: string) => void;
}) {
  const { t } = useI18n();
  const field = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <h2 className="font-body font-bold text-foreground">{t("roleAccess")}</h2>
      <label className="block space-y-1 md:max-w-xs"><span className={lbl}>{t("role")}</span>
        {canEdit
          ? <select value={member.role ?? ""} onChange={(e) => onRole(e.target.value as AppRole)} className={field}>{ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}</select>
          : <input value={member.role ?? "—"} disabled className={field} />}
      </label>
      <div className="text-sm"><span className={lbl}>{t("modulesVisible")}</span>
        <p className="text-muted-foreground">{MODULES[member.role ?? ""] ?? "—"}</p></div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => { const p = window.prompt(t("assignPin")); if (p) onPin(p); }} className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold text-primary">{t("assignPin")}</button>
        <span className="text-xs text-muted-foreground">{t("lastAccess")}: {t("comingSoon")}</span>
      </div>
    </div>
  );
}
