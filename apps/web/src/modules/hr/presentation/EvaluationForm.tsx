import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { classify } from "@hr/domain/evaluation.types";
import type { Criterion, SaveScore, Suggestion, EvalResult } from "@hr/domain/evaluation.types";
import { CLASS_COLOR, CLASS_KEY } from "@hr/presentation/eval-ui";

type Emp = { id: string; full_name: string };

export function EvaluationForm({ employees, criteria, onSuggest, onSubmit, onCancel }: {
  employees: Emp[]; criteria: Criterion[];
  onSuggest: (id: string, from: string, to: string) => Promise<Suggestion>;
  onSubmit: (id: string, period: string, scores: SaveScore[], notes: string) => Promise<EvalResult>;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [emp, setEmp] = useState("");
  const [period, setPeriod] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const wsum = criteria.reduce((s, c) => s + c.weight, 0);
  const composite = wsum > 0 ? criteria.reduce((s, c) => s + (scores[c.id] ?? 0) * c.weight, 0) / wsum : 0;
  const cls = classify(composite);

  async function suggest() {
    if (!emp) return;
    const to = new Date(); const from = new Date(); from.setMonth(to.getMonth() - 3);
    const s = await onSuggest(emp, from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
    const op = criteria.find((c) => /operacional/i.test(c.label));
    if (op) setScores((v) => ({ ...v, [op.id]: s.suggestedOperational }));
  }
  async function submit() {
    if (!emp || !period) return;
    setBusy(true);
    const r = await onSubmit(emp, period, criteria.map((c) => ({ criterionId: c.id, score: scores[c.id] ?? 0 })), notes);
    setBusy(false);
    if (!r.ok) window.alert(r.error); else onCancel();
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <select required value={emp} onChange={(e) => setEmp(e.target.value)} className={fld}>
          <option value="">{t("employee")}</option>{employees.map((x) => <option key={x.id} value={x.id}>{x.full_name}</option>)}</select>
        <input required value={period} onChange={(e) => setPeriod(e.target.value)} placeholder={t("period")} className={fld} />
      </div>
      <button type="button" onClick={() => void suggest()} disabled={!emp}
        className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-primary disabled:opacity-50">{t("autoSuggest")}</button>
      <div className="space-y-3">{criteria.map((c) => (
        <div key={c.id} className="space-y-1">
          <div className="flex justify-between text-sm"><span className="font-bold">{c.label} <span className="text-xs text-muted-foreground">({Math.round(c.weight * 100)}%)</span></span>
            <span className="font-bold text-primary">{scores[c.id] ?? 0}</span></div>
          <input type="range" min={0} max={10} step={0.5} value={scores[c.id] ?? 0}
            onChange={(e) => setScores((v) => ({ ...v, [c.id]: Number(e.target.value) }))} className="w-full" /></div>))}</div>
      <div className={`flex items-center justify-between rounded-lg p-3 ${CLASS_COLOR[cls]}`}>
        <span className="font-bold">{t("composite")}: {composite.toFixed(2)}</span><span className="font-bold">{t(CLASS_KEY[cls])}</span></div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notes")} rows={2} className={fld} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("save")}</button>
        <button type="button" onClick={onCancel} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
      </div>
    </form>
  );
}
