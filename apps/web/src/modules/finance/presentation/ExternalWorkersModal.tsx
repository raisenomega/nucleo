import { useMemo, useState } from "react";
import { X, Plus, Pencil, Power } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useToast } from "@shared/providers/toast-context";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useExternalWorkers } from "@finance/application/useExternalWorkers.hook";
import { supabaseExternalWorkerRepository } from "@finance/infrastructure/supabase-external-workers.repository";
import { ExternalWorkerForm, EXTERNAL_TYPE_LABEL } from "@finance/presentation/ExternalWorkerForm";
import type { ExternalWorker, ExternalWorkerFormData } from "@finance/domain/external-worker.types";

export function ExternalWorkersModal({ onClose, onWorkerCreated }: { onClose: () => void; onWorkerCreated?: (w: ExternalWorker) => void }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const toast = useToast();
  const { items, create, update } = useExternalWorkers(supabaseExternalWorkerRepository);
  const [editing, setEditing] = useState<string | null>(null);

  const editRow = useMemo<ExternalWorkerFormData | undefined>(() => items.find((x) => x.id === editing), [editing, items]);
  async function submit(d: ExternalWorkerFormData) {
    const isNew = !editing || editing === "new";
    const r = isNew ? await create(d) : await update(editing, d);
    if (!r.ok) return void toast.error(r.error);
    setEditing(null); toast.success(t("saved"));
    if (isNew) onWorkerCreated?.(r.value); // crear → el parent cierra el modal y abre nueva nómina preseleccionada
  }
  const toggle = (w: ExternalWorker) => void update(w.id, { ...w, active: !w.active });
  const th = "p-2 text-left text-xs font-bold uppercase text-muted-foreground";

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
        {items.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr><th className={th}>{t("name")}</th><th className={th}>{t("workerTypeLabel")}</th><th className={th}>{t("specialty")}</th><th className={th}>{t("phone")}</th><th className={th}>{t("department")}</th><th className={th}>{t("active")}</th><th className={th} /></tr></thead>
          <tbody>{items.map((w) => (
            <tr key={w.id} className={`border-t border-border ${w.active ? "" : "opacity-50"}`}>
              <td className="p-2 font-body text-foreground">{w.fullName}</td>
              <td className="p-2">{t(EXTERNAL_TYPE_LABEL[w.workerType])}</td>
              <td className="p-2">{w.specialty || "—"}</td><td className="p-2">{w.phone || "—"}</td>
              <td className="p-2">{w.department || "—"}</td><td className="p-2">{w.active ? t("active") : "—"}</td>
              <td className="p-2"><div className="flex gap-3">
                {can("payroll", "edit") && <button type="button" onClick={() => setEditing(w.id)} aria-label={t("edit")}><Pencil className="h-4 w-4" /></button>}
                {can("payroll", "edit") && <button type="button" onClick={() => toggle(w)} aria-label={t("active")} className={w.active ? "text-destructive" : "text-primary"}><Power className="h-4 w-4" /></button>}
              </div></td>
            </tr>
          ))}</tbody>
        </table></div>}
      </div>
    </ScreenModal>
  );
}
