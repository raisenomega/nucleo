import { Pause, Play, Ban, FilePlus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { MobileCard } from "@shared/components/MobileCard";
import { FREQ_KEY, PLAN_ST_KEY, PLAN_ST_COLOR } from "@billing/presentation/billing-ui";
import type { BillingPlan, PlanStatus } from "@billing/domain/billing-plan.types";

export function BillingPlanTable({ rows, canManage, onStatus, onGenerate }: {
  rows: readonly BillingPlan[]; canManage: boolean;
  onStatus: (id: string, st: PlanStatus) => void; onGenerate: (p: BillingPlan) => void;
}) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const st = (p: BillingPlan) => <span className={`rounded px-2 py-0.5 text-xs font-bold ${PLAN_ST_COLOR[p.status]}`}>{t(PLAN_ST_KEY[p.status])}</span>;
  const acts = (p: BillingPlan) => canManage ? (
    <div className="flex gap-3 pt-1">
      {p.status === "active" && <button type="button" onClick={() => onStatus(p.id, "paused")} aria-label={t("pause")} className="text-amber-600"><Pause className="h-5 w-5" /></button>}
      {p.status === "paused" && <button type="button" onClick={() => onStatus(p.id, "active")} aria-label={t("resume")} className="text-green-600"><Play className="h-5 w-5" /></button>}
      {p.status !== "cancelled" && <button type="button" onClick={() => onStatus(p.id, "cancelled")} aria-label={t("cancel")} className="text-destructive"><Ban className="h-5 w-5" /></button>}
      {p.status === "active" && <button type="button" onClick={() => onGenerate(p)} aria-label={t("generateInvoice")} className="text-primary"><FilePlus className="h-5 w-5" /></button>}
    </div>) : null;
  return (
    <div className="space-y-2">{rows.map((p) => (
      <MobileCard key={p.id} title={p.clientName} amount={formatCurrency(p.amount)}
        lines={[`${t(FREQ_KEY[p.frequency])} · ${t("nextBilling")}: ${p.nextBillingDate}`]}
        extra={<div className="flex items-center gap-2">{st(p)}{acts(p)}</div>} />))}</div>
  );
}
