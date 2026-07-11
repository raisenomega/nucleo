import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus, AlertTriangle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useSession } from "@shared/providers/SessionProvider";
import { useDocuments } from "@documents/application/useDocuments.hook";
import { supabaseDocumentRepository } from "@documents/infrastructure/supabase-document.repository";
import { DocumentUpload } from "@documents/presentation/DocumentUpload";
import { DocumentTable } from "@documents/presentation/DocumentTable";
import { DocumentDetail } from "@documents/presentation/DocumentDetail";
import { DOC_CATEGORIES, DOC_CAT_KEY } from "@documents/presentation/doc-ui";
import type { Doc, DocStatus } from "@documents/domain/document.types";

export const Route = createFileRoute("/_authenticated/documents")({ component: DocumentsPage });

function DocumentsPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { session } = useSession();
  const m = useDocuments(supabaseDocumentRepository);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Doc | null>(null);
  const [filter, setFilter] = useState("");
  if (!can("documents", "view")) return <Navigate to="/dashboard" />;
  const rows = filter ? m.list.filter((d) => d.category === filter) : m.list;
  const onStatus = (status: DocStatus, newExp: string | null) => { if (viewing) { void m.setStatus(viewing.id, status, newExp); setViewing(null); } };
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("documents")}</h1>
          <div className="flex items-center gap-2">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={fld}>
              <option value="">{t("allTypes")}</option>{DOC_CATEGORIES.map((c) => <option key={c} value={c}>{t(DOC_CAT_KEY[c])}</option>)}</select>
            {can("documents", "create") && <button type="button" onClick={() => setCreating((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold">
              <Plus className="h-4 w-4" /> {t("newDocument")}</button>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("documentsSubtitle")}</p>
      </div>
      {m.expiring.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/15 p-3 text-sm font-bold text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5" /> {m.expiring.length} {t("expiringSoon")}</div>)}
      {creating && <DocumentUpload tenantId={session?.tenantId ?? ""} onUpload={m.upload} onSubmit={m.save} onCancel={() => setCreating(false)} />}
      <DocumentTable rows={rows} onView={(id) => { const d = m.list.find((x) => x.id === id); if (d) setViewing(d); }} />
      {viewing && <DocumentDetail doc={viewing} getUrl={m.signedUrl} canManage={can("documents", "edit")} onStatus={onStatus} onClose={() => setViewing(null)} />}
    </div>
  );
}
