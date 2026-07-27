import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { Criterion } from "@hr/domain/evaluation.types";
import type { CycleResult } from "@hr/domain/evalcycle.types";

export function CompleteEvalModal({ evalId, criteria, onComplete, onClose }: {
  evalId: string; criteria: readonly Criterion[];
  onComplete: (id: string, scores: { criterionId: string; score: number }[], notes: string) => Promise<CycleResult>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  async function save() {
    const r = await onComplete(evalId, criteria.map((c) => ({ criterionId: c.id, score: scores[c.id] ?? 5 })), notes);
    if (r.ok) onClose(); else setErr(r.error);
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{t("composite")}</h2>
        {criteria.map((c) => (
          <label key={c.id} className="block space-y-1">
            <span className="flex justify-between text-xs font-bold text-muted-foreground">{c.label}<span className="text-foreground">{scores[c.id] ?? 5}</span></span>
            <input type="range" min="0" max="10" step="0.5" value={scores[c.id] ?? 5} onChange={(e) => setScores((p) => ({ ...p, [c.id]: Number(e.target.value) }))} className="w-full" /></label>))}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notes")} rows={2} className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button></div>
      </div>
    </ScreenModal>
  );
}
