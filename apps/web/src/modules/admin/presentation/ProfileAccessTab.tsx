import { useI18n } from "@shared/i18n";
import type { AppRole } from "@admin/domain/admin.types";

const ROLES: { v: AppRole; l: string }[] = [
  { v: "ceo", l: "CEO" }, { v: "coo", l: "COO" }, { v: "operaciones", l: "Operaciones" }, { v: "servicio", l: "Servicio" },
];
const ACCESS: Record<string, string[]> = {
  superadmin: ["Acceso total (plataforma raisen)"],
  ceo: ["Dashboard completo", "Ingresos / Gastos / Nómina / Extraordinarios (todo)", "Inventario con costos",
    "Leads / Marketing", "Conciliación + fiscal", "Configuración (equipo, categorías, settings)", "Crear categorías", "Ver perfiles de empleados"],
  coo: ["Todo lo de CEO excepto:", "❌ Tab Equipo y Config general", "❌ Cambiar roles", "✅ Tab Categorías en /settings"],
  operaciones: ["Dashboard (vista limitada)", "Inventario sin precios / costos, sin eliminar", "Gastos propios",
    "Rutas / Agenda", "❌ Nómina, Conciliación, Configuración, crear categorías"],
  servicio: ["Dashboard (mínimo)", "Inventario: solo nombre y stock", "❌ Todo lo demás (solo lectura)"],
};

export function ProfileAccessTab({ role, onRole, onPin }: {
  role: AppRole | null; onRole: (r: AppRole) => void; onPin: (pin: string) => void;
}) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-border bg-card p-5">
        <label className="block space-y-1 md:max-w-xs"><span className={lbl}>{t("role")}</span>
          <select value={role ?? ""} onChange={(e) => onRole(e.target.value as AppRole)} className={fld}>
            {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}</select></label>
        <div><span className={lbl}>{t("modulesVisible")}</span>
          <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
            {(ACCESS[role ?? ""] ?? []).map((a, i) => <li key={i}>· {a}</li>)}</ul></div>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-5">
        <button type="button" onClick={() => { const p = window.prompt(t("assignPin")); if (p) onPin(p); }}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-bold text-primary">{t("assignPin")}</button>
        <span className="text-xs text-muted-foreground">{t("lastAccess")}: {t("comingSoon")}</span>
      </div>
    </div>
  );
}
