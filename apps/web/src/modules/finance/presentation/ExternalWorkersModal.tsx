import { useMemo, useState } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useExternalWorkers } from "@finance/application/useExternalWorkers.hook";
import { supabaseExternalWorkerRepository } from "@finance/infrastructure/supabase-external-workers.repository";
import { ExternalWorkerForm, EXTERNAL_TYPE_LABEL } from "@finance/presentation/ExternalWorkerForm";
import type { ExternalWorkerFormData } from "@finance/domain/external-worker.types";

export function ExternalWorkersModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const toast = useToast();
  const { items, create, update, remove } = useExternalWorkers(supabaseExternalWorkerRepository);
  const [editing, setEditing] = useState<string | null>(null);

  const editRow = useMemo<ExternalWorkerFormData | undefined>(() => {
    const w = items.find((x) => x.id === editing);
    return w ? { fullName: w.fullName, workerType: w.workerType, taxId: w.taxId, contact: w.contact, notes: w.notes, active: w.active } : undefined;
  }, [editing, items]);

  async function submit(d: ExternalWorkerFormData) {
    const r = editing && editing !== "new" ? await update(editing, d) : await create(d);
    if (r.ok) { setEditing(null); toast.success(t("saved")); } else toast.error(r.error);
  }

  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("externalWorkers")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        {can("payroll", "create") && editing === null && (
          <button type="button" onClick={() => setEditing("new")} className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold"><Plus className="h-4 w-4" /> {t("newExternalWorker")}</button>
        )}
        {editing !== null && <ExternalWorkerForm initial={editRow} onSubmit={submit} onCancel={() => setEditing(null)} />}
        {items.length === 0 && editing === null && <p className="text-sm text-muted-foreground">{t("noExternalWorkers")}</p>}
        <ul className="divide-y divide-border">
          {items.map((w) => (
            <li key={w.id} className="flex items-center justify-between py-2">
              <div><p className="font-body text-sm text-foreground">{w.fullName}</p>
                <p className="text-xs text-muted-foreground">{t(EXTERNAL_TYPE_LABEL[w.workerType])}{w.contact && ` · ${w.contact}`}</p></div>
              <div className="flex gap-3">
                {can("payroll", "edit") && <button type="button" onClick={() => setEditing(w.id)} aria-label={t("edit")}><Pencil className="h-4 w-4" /></button>}
                {can("payroll", "delete") && <button type="button" onClick={() => { if (window.confirm(`${t("delete")}?`)) void remove(w.id); }} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ScreenModal>
  );
}
