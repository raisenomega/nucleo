import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { CourseInput, TrResult } from "@hr/domain/training.types";

export function CourseForm({ onSubmit, onCancel }: { onSubmit: (id: string | null, c: CourseInput) => Promise<TrResult>; onCancel: () => void }) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [hours, setHours] = useState(0);
  const [required, setRequired] = useState(false);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!title.trim()) return;
    setBusy(true);
    const r = await onSubmit(null, { title: title.trim(), category, hours, required, description });
    setBusy(false);
    if (!r.ok) window.alert(r.error); else onCancel();
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-3 rounded-lg border border-border bg-card p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("courseTitle")} className={`${fld} md:col-span-2`} />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("category")} className={fld} />
        <input type="number" step="0.5" min="0" value={hours || ""} onChange={(e) => setHours(Number(e.target.value))} placeholder={t("hours")} className={fld} />
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} /> {t("required")}</label>
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("description")} rows={2} className={fld} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
