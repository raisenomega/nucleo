import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { BlockedPeriodInput } from "@agenda/domain/blocked-period.types";

export function BlockedPeriodModal({ onSave, onClose }: { onSave: (i: BlockedPeriodInput) => Promise<void>; onClose: () => void }) {
  const { t } = useI18n();
  const [reason, setReason] = useState("");
  const [fullDay, setFullDay] = useState(false);
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const startsAt = fullDay ? `${from}T00:00:00` : from;
  const endsAt = fullDay ? `${to}T23:59:59` : to;
  const canSave = !!from && !!to && startsAt < endsAt;
  async function submit() { setBusy(true); await onSave({ startsAt, endsAt, reason, isFullDay: fullDay }); setBusy(false); }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("agendaAddBlock")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4 text-foreground">
        <label className="block text-sm font-medium">{t("agendaBlockReason")}<input value={reason} onChange={(e) => setReason(e.target.value)} className={fld} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fullDay} onChange={(e) => setFullDay(e.target.checked)} />{t("agendaAllDay")}</label>
        <div className="flex flex-wrap gap-3">
          <label className="block text-sm font-medium">{t("agendaFrom")}<input type={fullDay ? "date" : "datetime-local"} value={from} onChange={(e) => setFrom(e.target.value)} className={fld} /></label>
          <label className="block text-sm font-medium">{t("agendaTo")}<input type={fullDay ? "date" : "datetime-local"} value={to} onChange={(e) => setTo(e.target.value)} className={fld} /></label>
        </div>
        <button type="button" disabled={busy || !canSave} onClick={() => void submit()} className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("save")}</button>
      </div>
    </ScreenModal>
  );
}
