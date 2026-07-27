import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { RES_ICON, RES_KEY } from "@hr/presentation/res-ui";
import type { Resource } from "@hr/domain/resource.types";

// Selector: recursos de la biblioteca aún no vinculados a este curso. Toggle "obligatorio" + añadir.
export function LinkResourceModal({ library, linkedIds, onLink, onClose }: {
  library: readonly Resource[]; linkedIds: ReadonlySet<string>;
  onLink: (resourceId: string, required: boolean) => Promise<void>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [req, setReq] = useState<Set<string>>(new Set());
  const available = library.filter((r) => !linkedIds.has(r.id));
  const toggle = (id: string) => setReq((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("addMaterial")}</h2>
        {available.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRecords")}</p> : (
          <ul className="space-y-2">{available.map((r) => { const Icon = RES_ICON[r.resourceType]; return (
            <li key={r.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-sm">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 font-semibold text-foreground">{r.title}</span>
              <span className="text-xs text-muted-foreground">{t(RES_KEY[r.resourceType])}</span>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={req.has(r.id)} onChange={() => toggle(r.id)} /> {t("required")}</label>
              <button type="button" onClick={() => void onLink(r.id, req.has(r.id))} className="rounded bg-primary px-2 py-1 text-primary-foreground"><Plus className="h-4 w-4" /></button>
            </li>); })}</ul>)}
        <div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("close")}</button></div>
      </div>
    </ScreenModal>
  );
}
