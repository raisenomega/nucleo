import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { supabasePortalRepository } from "@hr/infrastructure/supabase-portal.repository";
import { CourseResourcesPanel } from "@hr/presentation/CourseResourcesPanel";
import { MyCertifications } from "@hr/presentation/MyCertifications";
import { ENROLL_KEY, ENROLL_COLOR } from "@hr/presentation/tr-ui";
import type { MyCourse } from "@hr/domain/portal.types";
import type { EnrollStatus } from "@hr/domain/training.types";

// Mis cursos asignados + materiales (CourseResourcesPanel read-only) + mis certificaciones.
export function MyTraining() {
  const { t } = useI18n();
  const [rows, setRows] = useState<MyCourse[]>([]);
  const [mat, setMat] = useState<{ id: string; title: string } | null>(null);
  useEffect(() => { void supabasePortalRepository.training().then(setRows); }, []);
  return (
    <div className="space-y-6">
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRecords")}</p> : (
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="p-2">{t("course")}</th><th className="p-2">{t("status")}</th><th className="p-2">{t("score")}</th>
            <th className="p-2">{t("dueDate")}</th><th className="p-2"></th></tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c.id} className="border-b border-border">
              <td className="p-2 font-semibold">{c.title}</td>
              <td className="p-2"><span className={`rounded px-2 py-0.5 text-xs font-bold ${ENROLL_COLOR[c.status as EnrollStatus]}`}>{t(ENROLL_KEY[c.status as EnrollStatus])}</span></td>
              <td className="p-2">{c.score != null ? `${c.score}%` : "—"}</td><td className="p-2">{c.dueDate ?? "—"}</td>
              <td className="p-2 text-right"><button type="button" onClick={() => setMat({ id: c.courseId, title: c.title })} className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                <BookOpen className="h-4 w-4" /> {t("viewMaterials")}</button></td></tr>))}</tbody>
        </table>)}
      <MyCertifications />
      {mat && <CourseResourcesPanel courseId={mat.id} courseTitle={mat.title} canEdit={false} onClose={() => setMat(null)} />}
    </div>
  );
}
