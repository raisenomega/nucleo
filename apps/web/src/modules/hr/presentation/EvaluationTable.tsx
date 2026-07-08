import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { MobileCard } from "@shared/components/MobileCard";
import { Pagination } from "@shared/components/Pagination";
import { CLASS_COLOR, CLASS_KEY } from "@hr/presentation/eval-ui";
import type { Evaluation } from "@hr/domain/evaluation.types";

// Lista de evaluaciones: tabla en desktop, cards en mobile. ⚠️ si requiere validación legal (Ley 80).
export function EvaluationTable({ rows, onView }: { rows: readonly Evaluation[]; onView: (id: string) => void }) {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const visible = rows.slice((page - 1) * 12, page * 12);
  const badge = (e: Evaluation) => e.classification
    ? <span className={`rounded px-2 py-0.5 text-xs font-bold ${CLASS_COLOR[e.classification]}`}>{t(CLASS_KEY[e.classification])}</span> : null;
  const warn = (e: Evaluation) => e.requiresLegalValidation
    ? <span title={t("legalWarning")} className="text-red-600"><AlertTriangle className="inline h-4 w-4" /></span> : null;
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("employee")}</th><th className="p-2">{t("period")}</th>
          <th className="p-2">{t("composite")}</th><th className="p-2">{t("classification")}</th><th className="p-2"></th></tr></thead>
        <tbody>{visible.map((e) => (
          <tr key={e.id} onClick={() => onView(e.id)} className="cursor-pointer border-b border-border hover:bg-secondary">
            <td className="p-2 font-semibold">{e.employeeName}</td><td className="p-2">{e.period}</td>
            <td className="p-2 font-bold text-primary">{e.compositeScore.toFixed(2)}</td>
            <td className="p-2">{badge(e)} {warn(e)}</td>
            <td className="p-2 text-right text-muted-foreground">{t("viewDetail")}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{visible.map((e) => (
        <MobileCard key={e.id} title={e.employeeName} amount={e.compositeScore.toFixed(2)} lines={[e.period]}
          extra={<div className="flex items-center gap-2 pt-1">{badge(e)} {warn(e)}</div>} onView={() => onView(e.id)} />))}</div>
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
