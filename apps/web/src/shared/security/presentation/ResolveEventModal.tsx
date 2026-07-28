import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { GuardianEvent, ISecurityRepository } from "@shared/security/domain/security.types";

export function ResolveEventModal({ event, repo, onClose, onDone }: { event: GuardianEvent; repo: ISecurityRepository; onClose: () => void; onDone: () => void }) {
  const { t } = useI18n();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); await repo.resolveEvent(event.id, notes); setBusy(false); onDone(); };
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4">
        <h2 className="font-display font-bold text-foreground">{t("secResolveTitle")}</h2>
        <p className="text-sm text-muted-foreground">{event.eventType}</p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("secResolveNotes")} rows={3}
          className="w-full rounded-lg border border-border bg-card p-2 text-sm" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-bold">{t("cancel")}</button>
          <button type="button" disabled={busy} onClick={() => void submit()} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground disabled:opacity-50">{t("secResolve")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
