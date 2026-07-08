import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { CategoryPicker } from "@shared/components/CategoryPicker";
import { PRIORITIES, PRIO_KEY } from "@hr/presentation/support-ui";
import type { Priority, TicketInput, SupResult } from "@hr/domain/support.types";

export function TicketForm({ onSubmit, onCancel }: { onSubmit: (t: TicketInput) => Promise<SupResult>; onCancel: () => void }) {
  const { t } = useI18n();
  const [subject, setSubject] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!subject.trim()) return;
    setBusy(true);
    const r = await onSubmit({ subject: subject.trim(), categoryId, priority, description });
    setBusy(false);
    if (!r.ok) window.alert(r.error); else onCancel();
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-3 rounded-lg border border-border bg-card p-5">
      <input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("subject")} className={fld} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <CategoryPicker kind="support_category" value={categoryId} onChange={setCategoryId} label="category" />
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={fld}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{t(PRIO_KEY[p])}</option>)}</select>
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("description")} rows={3} className={fld} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("send")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
