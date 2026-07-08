import { AlertTriangle, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { MobileCard } from "@shared/components/MobileCard";
import { CAT_COLOR, CAT_KEY } from "@hr/presentation/obs-ui";
import type { Observation } from "@hr/domain/observation.types";

const overdue = (o: Observation) => o.requiresFollowUp && o.followUpDate != null && o.followUpDate < new Date().toISOString().slice(0, 10);

// Bitácora de observaciones: tabla en desktop, cards en mobile. ⚠️ si el seguimiento está vencido.
export function ObservationTable({ rows, onDelete }: { rows: readonly Observation[]; onDelete?: (id: string) => void }) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const badge = (o: Observation) => <span className={`rounded px-2 py-0.5 text-xs font-bold ${CAT_COLOR[o.category]}`}>{t(CAT_KEY[o.category])}</span>;
  const warn = (o: Observation) => overdue(o) ? <span title={t("followUp")} className="text-red-600"><AlertTriangle className="inline h-4 w-4" /></span> : null;
  const del = (o: Observation) => onDelete ? <button type="button" onClick={() => onDelete(o.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button> : null;
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("employee")}</th><th className="p-2">{t("category")}</th><th className="p-2">{t("notes")}</th>
          <th className="p-2">{t("date")}</th><th className="p-2"></th></tr></thead>
        <tbody>{rows.map((o) => (
          <tr key={o.id} className="border-b border-border align-top">
            <td className="p-2 font-semibold">{o.employeeName}</td><td className="p-2">{badge(o)} {warn(o)}</td>
            <td className="max-w-xs p-2 text-muted-foreground">{o.notes}</td>
            <td className="p-2">{o.createdAt.slice(0, 10)}</td><td className="p-2 text-right">{del(o)}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{rows.map((o) => (
        <MobileCard key={o.id} title={o.employeeName} lines={[o.notes, o.createdAt.slice(0, 10)]}
          extra={<div className="flex items-center gap-2 pt-1">{badge(o)} {warn(o)}</div>} onDelete={onDelete ? () => onDelete(o.id) : undefined} />))}</div>
    </>
  );
}
