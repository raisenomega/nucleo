import { X, Plus } from "lucide-react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import type { ExamQuestion, QuestionType } from "@hr/domain/screening.types";

const TYPES: QuestionType[] = ["multiple_choice", "multiple_select", "true_false"];
const TKEY = (x: QuestionType): TranslationKey => (x === "multiple_choice" ? "qtMc" : x === "multiple_select" ? "qtMs" : "qtTf");

// Editor de una pregunta: texto, tipo, opciones con marca de correcta (radio/checkbox), puntos.
export function QuestionEditor({ q, onChange, onRemove }: { q: ExamQuestion; onChange: (q: ExamQuestion) => void; onRemove: () => void }) {
  const { t } = useI18n();
  const opts = q.options ?? [];
  const set = (patch: Partial<ExamQuestion>) => onChange({ ...q, ...patch });
  const isCorrect = (id: string) => (q.type === "multiple_select" ? Array.isArray(q.correct) && q.correct.includes(id) : q.correct === id);
  const toggle = (id: string) => {
    if (q.type === "multiple_select") { const a = Array.isArray(q.correct) ? q.correct : []; set({ correct: a.includes(id) ? a.filter((x) => x !== id) : [...a, id] }); }
    else set({ correct: id });
  };
  const fld = "w-full rounded border border-border bg-background p-1.5 text-sm";
  return (
    <div className="space-y-2 rounded-lg border border-border p-2">
      <div className="flex gap-1">
        <input value={q.text} onChange={(e) => set({ text: e.target.value })} placeholder={t("question")} className={fld} />
        <button type="button" onClick={onRemove} aria-label={t("delete")} className="shrink-0 text-destructive"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex gap-2">
        <select value={q.type} onChange={(e) => set({ type: e.target.value as QuestionType, correct: e.target.value === "true_false" ? true : e.target.value === "multiple_select" ? [] : "" })} className={fld}>
          {TYPES.map((x) => <option key={x} value={x}>{t(TKEY(x))}</option>)}</select>
        <input type="number" min="1" value={q.points || 1} onChange={(e) => set({ points: Number(e.target.value) })} className={`${fld} w-20`} />
      </div>
      {q.type === "true_false" ? (
        <div className="space-y-1">
          <input value={q.statement ?? ""} onChange={(e) => set({ statement: e.target.value })} placeholder={t("statement")} className={fld} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={q.correct === true} onChange={(e) => set({ correct: e.target.checked })} /> {t("correctIsTrue")}</label>
        </div>
      ) : (
        <div className="space-y-1">
          {opts.map((o) => (
            <div key={o.id} className="flex items-center gap-1">
              <input type={q.type === "multiple_select" ? "checkbox" : "radio"} checked={isCorrect(o.id)} onChange={() => toggle(o.id)} />
              <input value={o.text} onChange={(e) => set({ options: opts.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)) })} placeholder={t("option")} className={fld} />
              <button type="button" onClick={() => set({ options: opts.filter((x) => x.id !== o.id) })} aria-label={t("delete")} className="text-destructive"><X className="h-3 w-3" /></button>
            </div>))}
          <button type="button" onClick={() => set({ options: [...opts, { id: String.fromCharCode(97 + opts.length), text: "" }] })} className="flex items-center gap-1 text-xs font-bold text-primary"><Plus className="h-3 w-3" /> {t("option")}</button>
        </div>
      )}
    </div>
  );
}
