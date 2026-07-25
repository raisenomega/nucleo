import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { VoidModal } from "@shared/components/VoidModal";
import { accountingActionsRepository as repo } from "@accounting/infrastructure/supabase-accounting-actions.repository";
import type { JournalEntry } from "@accounting/domain/journal-entry.types";

// Acciones sobre asientos MANUALES (solo CEO). draft → Postear/Eliminar/Anular · posted → Anular. Los auto/cierre no.
export function EntryActions({ entry, onChanged }: { entry: JournalEntry; onChanged: () => void }) {
  const { t } = useI18n(); const toast = useToast();
  const [voiding, setVoiding] = useState(false);
  if (entry.entryType !== "manual" || entry.status === "voided") return null;
  const post = async () => {
    if (!window.confirm(t("confirmPostEntry"))) return;
    const r = await repo.postEntry(entry.id);
    if (r.ok) { toast.success(t("postedOk")); onChanged(); } else toast.error(r.error);
  };
  const del = async () => {
    if (!window.confirm(t("confirmDeleteEntry"))) return;
    const r = await repo.deleteEntry(entry.id);
    if (r.ok) { toast.success(t("deletedOk")); onChanged(); } else toast.error(r.error);
  };
  const doVoid = async (reason: string) => {
    setVoiding(false);
    const r = await repo.voidEntry(entry.id, reason);
    if (r.ok) { toast.success(t("voidedOk")); onChanged(); } else toast.error(r.error);
  };
  const btn = "rounded px-2 py-1 text-xs font-bold";
  return (
    <div className="mt-2 flex gap-2">
      {entry.status === "draft" && (
        <>
          <button type="button" onClick={() => void post()} className={`${btn} bg-primary text-primary-foreground`}>{t("postEntry")}</button>
          <button type="button" onClick={() => void del()} className={`${btn} bg-secondary text-foreground`}>{t("deleteEntry")}</button>
        </>
      )}
      <button type="button" onClick={() => setVoiding(true)} className={`${btn} bg-destructive text-white`}>{t("voidEntry")}</button>
      {voiding && <VoidModal onConfirm={(r) => void doVoid(r)} onClose={() => setVoiding(false)} />}
    </div>
  );
}
