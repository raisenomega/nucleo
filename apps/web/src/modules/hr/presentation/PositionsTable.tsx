import { Pencil, FilePlus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { EMP_KEY, payRange } from "@hr/presentation/recruit-ui";
import type { JobPosition } from "@hr/domain/recruitment.types";

// Tabla de puestos: crear vacante / editar por fila.
export function PositionsTable({ rows, onEdit, onCreateOpening }: {
  rows: readonly JobPosition[]; onEdit: (p: JobPosition) => void; onCreateOpening: (p: JobPosition) => void;
}) {
  const { t } = useI18n();
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{t("noRecords")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("jobTitle")}</th><th className="p-2">{t("department")}</th><th className="p-2">{t("employmentType")}</th>
          <th className="p-2">{t("salary")}</th><th className="p-2">{t("positionsCount")}</th><th className="p-2"></th></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p.id} className="border-b border-border">
            <td className="p-2 font-semibold">{p.title}</td><td className="p-2 text-muted-foreground">{p.department ?? "—"}</td>
            <td className="p-2">{t(EMP_KEY[p.employmentType])}</td>
            <td className="p-2">{payRange(p.salaryMin, p.salaryMax) || "—"}</td>
            <td className="p-2">{p.positionsCount}</td>
            <td className="p-2"><div className="flex justify-end gap-2">
              <button type="button" onClick={() => onCreateOpening(p)} className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-bold"><FilePlus className="h-3 w-3" /> {t("createOpening")}</button>
              <button type="button" onClick={() => onEdit(p)} aria-label={t("edit")} className="text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
            </div></td></tr>))}</tbody>
      </table>
    </div>
  );
}
