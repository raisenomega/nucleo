import { LayoutGrid, Wallet, Truck, Briefcase, Package, Users } from "lucide-react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import type { DashView } from "@finance/application/dash-health";

// Chips de navegación NEUTROS (sin color de salud). Activo = filled con el primary del tema.
const META: Record<DashView, { label: TranslationKey; Icon: typeof Wallet }> = {
  general: { label: "dashboardGeneral", Icon: LayoutGrid }, finanzas: { label: "finance", Icon: Wallet },
  operaciones: { label: "operations", Icon: Truck }, cartera: { label: "portfolio", Icon: Briefcase },
  inventario: { label: "inventory", Icon: Package }, comercial: { label: "commercial", Icon: Users },
};

export function DashboardChips({ views, active, onChange }: { views: readonly DashView[]; active: DashView; onChange: (v: DashView) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-1.5">
      {views.map((v) => {
        const m = META[v]; const on = active === v;
        return (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-bold ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-foreground"}`}>
            <m.Icon className="h-4 w-4" />{t(m.label)}
          </button>
        );
      })}
    </div>
  );
}
