import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { ScreenModal } from "@shared/components/ScreenModal";
import { useExternalWorkers } from "@finance/application/useExternalWorkers.hook";
import { supabaseExternalWorkerRepository } from "@finance/infrastructure/supabase-external-workers.repository";
import { ExternalWorkerForm } from "@finance/presentation/ExternalWorkerForm";
import type { ExternalWorker, ExternalWorkerFormData } from "@finance/domain/external-worker.types";

// Modal solo-form: crear (editId ausente) o editar. La lista vive ahora en la página (ExternalWorkersTable).
export function ExternalWorkersModal({ initial, editId, onClose, onSaved, onWorkerCreated }: {
  initial?: ExternalWorkerFormData; editId?: string; onClose: () => void;
  onSaved?: () => void; onWorkerCreated?: (w: ExternalWorker) => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const { create, update } = useExternalWorkers(supabaseExternalWorkerRepository);
  async function submit(d: ExternalWorkerFormData) {
    const r = editId ? await update(editId, d) : await create(d);
    if (!r.ok) return void toast.error(r.error);
    toast.success(t("saved")); onSaved?.();
    if (editId) onClose(); else onWorkerCreated?.(r.value); // crear → el parent abre nueva nómina preseleccionada
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{editId ? t("edit") : t("newExternalWorker")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="p-4"><ExternalWorkerForm initial={initial} onSubmit={submit} onCancel={onClose} /></div>
    </ScreenModal>
  );
}
