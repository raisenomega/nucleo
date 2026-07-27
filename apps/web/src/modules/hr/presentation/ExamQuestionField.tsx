import { useI18n } from "@shared/i18n";
import type { ExamQuestion, Answer } from "@hr/domain/screening.types";

// Una pregunta del examen: opción múltiple (radio), selección múltiple (checkbox) o V/F.
export function ExamQuestionField({ q, index, value, onChange }: {
  q: ExamQuestion; index: number; value: Answer | undefined; onChange: (v: Answer) => void;
}) {
  const { t } = useI18n();
  const arr = Array.isArray(value) ? value : [];
  const row = "flex items-center gap-2 rounded-lg border border-border p-2 text-sm cursor-pointer hover:bg-secondary";
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-3">
      <p className="font-bold text-foreground">{index + 1}. {q.text}</p>
      {q.type === "true_false" ? (
        <div className="space-y-1">
          {q.statement && <p className="text-sm text-muted-foreground">{q.statement}</p>}
          <label className={row}><input type="radio" checked={value === true} onChange={() => onChange(true)} /> {t("trueLabel")}</label>
          <label className={row}><input type="radio" checked={value === false} onChange={() => onChange(false)} /> {t("falseLabel")}</label>
        </div>
      ) : q.type === "multiple_select" ? (
        <div className="space-y-1">{q.options?.map((o) => {
          const on = arr.includes(o.id);
          return <label key={o.id} className={row}><input type="checkbox" checked={on}
            onChange={() => onChange(on ? arr.filter((x) => x !== o.id) : [...arr, o.id])} /> {o.text}</label>;
        })}</div>
      ) : (
        <div className="space-y-1">{q.options?.map((o) => (
          <label key={o.id} className={row}><input type="radio" checked={value === o.id} onChange={() => onChange(o.id)} /> {o.text}</label>))}
        </div>
      )}
    </div>
  );
}
