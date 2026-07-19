import { useState } from "react";
import { useI18n, type TranslationKey } from "@shared/i18n";

const PRIO: Record<string, TranslationKey> = { low: "prioLow", normal: "prioNormal", high: "prioHigh", urgent: "prioUrgent" };

// Nuevo ticket: asunto + descripción + prioridad.
export function NewTicketForm({ onSubmit, onCancel }: { onSubmit: (s: string, d: string, p: string) => void; onCancel: () => void }) {
  const { t } = useI18n();
  const [subject, setSubject] = useState(""); const [desc, setDesc] = useState(""); const [prio, setPrio] = useState("normal");
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!subject.trim()) return; onSubmit(subject, desc, prio); }} className="space-y-3 rounded-lg border border-primary bg-card p-3">
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("pSubject")} className={fld} required />
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder={t("pDescription")} className={fld} />
      <select value={prio} onChange={(e) => setPrio(e.target.value)} className={fld}>{Object.keys(PRIO).map((p) => <option key={p} value={p}>{t(PRIO[p]!)}</option>)}</select>
      <div className="flex gap-2">
        <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary text-foreground px-4 py-2 text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
