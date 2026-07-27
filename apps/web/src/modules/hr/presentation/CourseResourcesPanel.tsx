import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Eye, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useResources } from "@hr/application/useResources.hook";
import { supabaseResourceRepository } from "@hr/infrastructure/supabase-resource.repository";
import { ResourceViewer } from "@hr/presentation/ResourceViewer";
import { LinkResourceModal } from "@hr/presentation/LinkResourceModal";
import { RES_ICON, RES_KEY } from "@hr/presentation/res-ui";
import type { Resource } from "@hr/domain/resource.types";

// Materiales de un curso: staff vincula/desvincula/marca obligatorio; empleado los revisa (read-only).
export function CourseResourcesPanel({ courseId, courseTitle, canEdit, onClose }: {
  courseId: string; courseTitle: string; canEdit: boolean; onClose: () => void;
}) {
  const { t } = useI18n();
  const m = useResources(supabaseResourceRepository);
  const [list, setList] = useState<Resource[]>([]);
  const [viewing, setViewing] = useState<Resource | null>(null); const [linking, setLinking] = useState(false);
  const load = useCallback(async () => { setList(await supabaseResourceRepository.courseResources(courseId)); }, [courseId]);
  useEffect(() => { void load(); }, [load]);
  const link = async (rid: string, req: boolean) => { await supabaseResourceRepository.linkToCourse(courseId, rid, req); await load(); setLinking(false); };
  const unlink = async (rid: string) => { await supabaseResourceRepository.unlinkFromCourse(courseId, rid); await load(); };
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("courseMaterials")} · {courseTitle}</h2>
        {list.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRecords")}</p> : (
          <ul className="space-y-2">{list.map((r) => { const Icon = RES_ICON[r.resourceType]; return (
            <li key={r.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-sm">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 font-semibold text-foreground">{r.title}</span>
              {r.isRequired && <span title={t("requiredMaterial")} className="text-amber-600"><AlertTriangle className="h-4 w-4" /></span>}
              <span className="hidden text-xs text-muted-foreground sm:inline">{t(RES_KEY[r.resourceType])}</span>
              <button type="button" onClick={() => setViewing(r)} aria-label={t("viewResource")} className="text-foreground"><Eye className="h-4 w-4" /></button>
              {canEdit && <button type="button" onClick={() => void unlink(r.id)} aria-label={t("unlinkFromCourse")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
            </li>); })}</ul>)}
        {canEdit && <button type="button" onClick={() => setLinking(true)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("addMaterial")}</button>}
        {viewing && <ResourceViewer res={viewing} sign={supabaseResourceRepository.signUrl} onClose={() => setViewing(null)} />}
        {linking && <LinkResourceModal library={m.library} linkedIds={new Set(list.map((r) => r.id))} onLink={link} onClose={() => setLinking(false)} />}
      </div>
    </ScreenModal>
  );
}
