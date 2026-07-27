import { useI18n } from "@shared/i18n";
import type { DashData } from "@finance/application/useDashboard.hook";
import type { Aging } from "@finance/domain/dashboard.types";

// Semáforo consolidado de salud del negocio: 3 pilares (Finanzas / Operaciones / Cartera).
const CLS: Record<"g" | "y" | "r", string> = { g: "bg-green-500/10 text-green-600", y: "bg-amber-500/10 text-amber-600", r: "bg-destructive/10 text-destructive" };
const late = (a: Aging | null) => (a ? a.b31_60 + a.b61_90 + a.b90_plus : 0);

export function DashHealth({ d }: { d: DashData }) {
  const { t } = useI18n();
  const fin: "g" | "y" | "r" = !d.snapshot ? "y" : d.snapshot.balance < 0 ? "r" : (d.fiscal && d.fiscal.operatingProfit < 0 ? "y" : "g");
  const ops: "g" | "y" | "r" = !d.ops ? "y" : d.ops.routesTotal > d.ops.routesDone || d.ops.maintAlerts > 0 ? "y" : "g";
  const veryLate = (d.ar?.b90_plus ?? 0) + (d.ap?.b90_plus ?? 0) + (d.ar?.b61_90 ?? 0) + (d.ap?.b61_90 ?? 0);
  const someLate = late(d.ar) + late(d.ap) + (d.ar?.b1_30 ?? 0) + (d.ap?.b1_30 ?? 0);
  const port: "g" | "y" | "r" = veryLate > 0 ? "r" : someLate > 0 ? "y" : "g";
  const chip = (lvl: "g" | "y" | "r", label: string) => (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${CLS[lvl]}`}>
      <span className="h-2 w-2 rounded-full bg-current" />{label}
    </span>
  );
  return <div className="flex flex-wrap gap-2">{chip(fin, t("finance"))}{chip(ops, t("operations"))}{chip(port, t("portfolio"))}</div>;
}
