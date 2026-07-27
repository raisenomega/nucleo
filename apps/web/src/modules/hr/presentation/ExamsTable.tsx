import { Pencil } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { RecruitmentExam } from "@hr/domain/screening.types";

// Tabla de exámenes de reclutamiento.
export function ExamsTable({ rows, onEdit }: { rows: readonly RecruitmentExam[]; onEdit: (e: RecruitmentExam) => void }) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("examTitle")}</th><th className="p-2">{t("questions")}</th><th className="p-2">{t("passingScore")}</th>
          <th className="p-2">{t("maxAttempts")}</th><th className="p-2">{t("active")}</th><th className="p-2"></th></tr></thead>
        <tbody>{rows.map((e) => (
          <tr key={e.id} className="border-b border-border">
            <td className="p-2 font-semibold">{e.title}</td><td className="p-2">{e.questions.length}</td>
            <td className="p-2">{e.passingScore}%</td><td className="p-2">{e.maxAttempts}</td>
            <td className="p-2">{e.isActive ? "✓" : "—"}</td>
            <td className="p-2 text-right"><button type="button" onClick={() => onEdit(e)} aria-label={t("edit")} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button></td></tr>))}</tbody>
      </table>
    </div>
  );
}
