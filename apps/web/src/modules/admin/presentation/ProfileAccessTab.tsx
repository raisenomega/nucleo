import { useI18n } from "@shared/i18n";
import type { AppRole } from "@admin/domain/admin.types";
import type { EmployeeDetailUpdate } from "@admin/domain/employee-detail.types";
import { ACCESS_MODULES, defaultsFor, type ModuleAccess, type Perm } from "@admin/domain/module-access";

const ROLES: { v: AppRole; l: string }[] = [
  { v: "ceo", l: "CEO" }, { v: "coo", l: "COO" }, { v: "operaciones", l: "Operaciones" }, { v: "servicio", l: "Servicio" },
];
const PERMS: Perm[] = ["view", "create", "edit", "delete"];
const PERM_L: Record<Perm, string> = { view: "Ver", create: "Crear", edit: "Editar", delete: "Eliminar" };

export function ProfileAccessTab({ role, onRole, onPin, form, set }: {
  role: AppRole | null; onRole: (r: AppRole) => void; onPin: (pin: string) => void;
  form: EmployeeDetailUpdate; set: (k: "module_access", v: ModuleAccess | null) => void;
}) {
  const { t } = useI18n();
  const custom = form.module_access != null;
  const eff: ModuleAccess = form.module_access ?? defaultsFor(role);
  function toggle(mk: string, p: Perm) {
    const base: ModuleAccess = JSON.parse(JSON.stringify(form.module_access ?? defaultsFor(role)));
    base[mk] = { ...base[mk], [p]: !base[mk]?.[p] };
    set("module_access", base);
  }
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <label className="space-y-1"><span className="block text-xs font-bold text-muted-foreground">{t("role")}</span>
          <select value={role ?? ""} onChange={(e) => { onRole(e.target.value as AppRole); set("module_access", null); }} className={`block ${fld}`}>
            {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}</select></label>
        <button type="button" onClick={() => set("module_access", null)} className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-primary">{t("resetDefaults")}</button>
        <span className={`text-xs font-bold ${custom ? "text-primary" : "text-muted-foreground"}`}>{custom ? t("customAccess") : t("roleDefaults")}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className="px-3 py-2 text-left">{t("module")}</th>
            {PERMS.map((p) => <th key={p} className="px-2 py-2 text-center">{PERM_L[p]}</th>)}
            <th className="px-3 py-2 text-left">{t("notes")}</th></tr></thead>
          <tbody>
            {ACCESS_MODULES.map((m) => (
              <tr key={m.key} className="border-t border-border">
                <td className="px-3 py-2 font-semibold">{m.label}</td>
                {PERMS.map((p) => <td key={p} className="px-2 py-2 text-center">
                  {m.crud.includes(p)
                    ? <button type="button" onClick={() => toggle(m.key, p)} className="text-base leading-none">{eff[m.key]?.[p] ? "✅" : "☐"}</button>
                    : <span className="text-muted-foreground">—</span>}</td>)}
                <td className="px-3 py-2 text-xs text-muted-foreground">{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <button type="button" onClick={() => { const p = window.prompt(t("assignPin")); if (p) onPin(p); }}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold text-primary">{t("assignPin")}</button>
        <span className="text-xs text-muted-foreground">{t("lastAccess")}: {t("comingSoon")}</span>
      </div>
    </div>
  );
}
