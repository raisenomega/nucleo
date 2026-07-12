import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { ServiceInput } from "@agenda/domain/reservable-service.types";

export function NestedCreateServiceModal({ onSave, onClose }: { onSave: (i: ServiceInput) => Promise<void>; onClose: () => void }) {
  const { t } = useI18n();
  const [name, setName] = useState(""); const [dur, setDur] = useState(30); const [price, setPrice] = useState(""); const [sched, setSched] = useState(true);
  const [busy, setBusy] = useState(false);
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm"; const cap = "mb-1 block text-sm font-medium";
  const canSave = name.trim().length >= 3 && dur >= 15;
  async function submit() { setBusy(true); await onSave({ name: name.trim(), durationMinutes: dur, price: price ? Number(price) : null, requiresScheduling: sched }); setBusy(false); }
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="nsm" onClick={onClose} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between"><h3 id="nsm" className="font-bold text-foreground">{t("agendaServiceModalTitle")}</h3><button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-5 w-5" /></button></div>
        <div className="mt-3 space-y-3 text-foreground">
          <label className="block"><span className={cap}>{t("agendaServiceModalName")}</span><input value={name} onChange={(e) => setName(e.target.value)} className={fld} /></label>
          <label className="block"><span className={cap}>{t("agendaServiceModalDuration")}</span><input type="number" min={15} max={480} step={15} value={dur} onChange={(e) => setDur(Number(e.target.value))} className={fld} /></label>
          <label className="block"><span className={cap}>{t("agendaServiceModalPrice")}</span><input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={fld} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sched} onChange={(e) => setSched(e.target.checked)} />{t("agendaServiceModalRequiresSched")}</label>
          <div className="flex gap-2">
            <button type="button" disabled={busy || !canSave} onClick={() => void submit()} className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{t("save")}</button>
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">{t("cancel")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
