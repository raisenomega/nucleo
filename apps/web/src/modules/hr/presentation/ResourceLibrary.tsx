import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useResources } from "@hr/application/useResources.hook";
import { supabaseResourceRepository } from "@hr/infrastructure/supabase-resource.repository";
import { ResourceCard } from "@hr/presentation/ResourceCard";
import { ResourceViewer } from "@hr/presentation/ResourceViewer";
import { ResourceFormModal } from "@hr/presentation/ResourceFormModal";
import { RES_TYPES, RES_KEY } from "@hr/presentation/res-ui";
import type { Resource, ResourceType } from "@hr/domain/resource.types";

// Biblioteca general: grilla de recursos con filtro por tipo + búsqueda. Staff crea; todos abren el viewer.
export function ResourceLibrary({ canEdit, tenantId }: { canEdit: boolean; tenantId: string }) {
  const { t } = useI18n();
  const m = useResources(supabaseResourceRepository);
  const [type, setType] = useState<ResourceType | "all">("all");
  const [q, setQ] = useState(""); const [viewing, setViewing] = useState<Resource | null>(null); const [creating, setCreating] = useState(false);
  const rows = useMemo(() => m.library.filter((r) => (type === "all" || r.resourceType === type)
    && (!q || r.title.toLowerCase().includes(q.toLowerCase()) || (r.category ?? "").toLowerCase().includes(q.toLowerCase()))), [m.library, type, q]);
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as ResourceType | "all")} className={fld}>
          <option value="all">{t("allTypes")}</option>{RES_TYPES.map((x) => <option key={x} value={x}>{t(RES_KEY[x])}</option>)}</select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className={`${fld} flex-1`} />
        {canEdit && <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
          <Plus className="h-4 w-4" /> {t("addResource")}</button>}
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRecords")}</p> : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{rows.map((r) => <ResourceCard key={r.id} res={r} onOpen={setViewing} />)}</div>)}
      {viewing && <ResourceViewer res={viewing} sign={m.repo.signUrl} onClose={() => setViewing(null)} />}
      {creating && <ResourceFormModal tenantId={tenantId} onCreate={m.create} upload={(id, f) => m.repo.uploadFile(tenantId, id, f)} onClose={() => setCreating(false)} />}
    </div>
  );
}
