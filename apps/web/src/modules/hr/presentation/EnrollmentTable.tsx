import { useState } from "react";
import { AlertTriangle, Check, Trash2, FileDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdf } from "@shared/hooks/usePdf";
import { MobileCard } from "@shared/components/MobileCard";
import { Pagination } from "@shared/components/Pagination";
import { ENROLL_KEY, ENROLL_COLOR } from "@hr/presentation/tr-ui";
import type { Enrollment } from "@hr/domain/training.types";

// Asignaciones: badge de estado, ⚠️ si curso obligatorio no completado, completar/certificado/eliminar.
export function EnrollmentTable({ rows, onComplete, onDelete }: {
  rows: readonly Enrollment[]; onComplete?: (id: string) => void; onDelete?: (id: string) => void;
}) {
  const { t } = useI18n();
  const pdf = usePdf();
  const [page, setPage] = useState(1);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  const visible = rows.slice((page - 1) * 12, page * 12);
  const badge = (e: Enrollment) => <span className={`rounded px-2 py-0.5 text-xs font-bold ${ENROLL_COLOR[e.status]}`}>{t(ENROLL_KEY[e.status])}</span>;
  const warn = (e: Enrollment) => e.courseRequired && e.status !== "completed" ? <span title={t("required")} className="text-amber-600"><AlertTriangle className="inline h-4 w-4" /></span> : null;
  const acts = (e: Enrollment) => (
    <div className="flex justify-end gap-2">
      {onComplete && e.status !== "completed" && <button type="button" onClick={() => onComplete(e.id)} aria-label={t("markComplete")} className="text-green-600"><Check className="h-4 w-4" /></button>}
      {e.status === "completed" && <button type="button" disabled={pdf.generating} onClick={() => void pdf.generatePdf("training", e.id)} aria-label={t("certificatePdf")} title={t("certificatePdf")} className="text-foreground disabled:opacity-50"><FileDown className="h-4 w-4" /></button>}
      {onDelete && <button type="button" onClick={() => onDelete(e.id)} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
    </div>);
  return (
    <>
      <table className="hidden w-full text-sm md:table">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("employee")}</th><th className="p-2">{t("course")}</th><th className="p-2">{t("status")}</th>
          <th className="p-2">{t("followUp")}</th><th className="p-2"></th></tr></thead>
        <tbody>{visible.map((e) => (
          <tr key={e.id} className="border-b border-border">
            <td className="p-2 font-semibold">{e.employeeName}</td><td className="p-2">{e.courseTitle}</td>
            <td className="p-2">{badge(e)} {warn(e)}</td><td className="p-2">{e.dueDate ?? "—"}</td>
            <td className="p-2">{acts(e)}</td></tr>))}</tbody>
      </table>
      <div className="space-y-2 md:hidden">{visible.map((e) => (
        <MobileCard key={e.id} title={e.employeeName} lines={[e.courseTitle, e.dueDate ?? undefined]}
          extra={<div className="flex items-center justify-between gap-2 pt-1"><span className="flex items-center gap-2">{badge(e)} {warn(e)}</span>{acts(e)}</div>} />))}</div>
      <Pagination total={rows.length} page={page} onPageChange={setPage} />
    </>
  );
}
