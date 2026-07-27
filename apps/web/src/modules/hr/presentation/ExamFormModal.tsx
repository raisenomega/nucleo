import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { QuestionEditor } from "@hr/presentation/QuestionEditor";
import type { ExamFormData, RecruitmentExam, ExamQuestion } from "@hr/domain/screening.types";
import type { RecruitResult } from "@hr/domain/recruitment.types";

const newQ = (): ExamQuestion => ({ id: "q" + Math.random().toString(36).slice(2, 8), text: "",
  type: "multiple_choice", options: [{ id: "a", text: "" }, { id: "b", text: "" }], correct: "", points: 1 });
const EMPTY = (): ExamFormData => ({ title: "", description: "", passingScore: 70, maxAttempts: 2, timeLimitMinutes: null,
  shuffleQuestions: true, shuffleOptions: true, showCorrectAnswers: false, questions: [] });
const toForm = (e: RecruitmentExam): ExamFormData => ({ title: e.title, description: e.description ?? "",
  passingScore: e.passingScore, maxAttempts: e.maxAttempts, timeLimitMinutes: e.timeLimitMinutes,
  shuffleQuestions: e.shuffleQuestions, shuffleOptions: e.shuffleOptions, showCorrectAnswers: e.showCorrectAnswers,
  questions: e.questions.map((q) => ({ ...q })) });

export function ExamFormModal({ initial, onSubmit, onClose }: {
  initial?: RecruitmentExam; onSubmit: (d: ExamFormData) => Promise<RecruitResult>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<ExamFormData>(initial ? toForm(initial) : EMPTY());
  const [err, setErr] = useState("");
  const set = (patch: Partial<ExamFormData>) => setF((p) => ({ ...p, ...patch }));
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const chk = "flex items-center gap-2 text-sm";
  async function save() {
    if (!f.title.trim() || f.questions.length === 0) { setErr(t("requiredFields")); return; }
    const r = await onSubmit(f);
    if (r.ok) onClose(); else setErr(r.error);
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4 md:p-6">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("editExam") : t("createExam")}</h2>
        <input value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder={t("examTitle")} className={fld} />
        <textarea value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder={t("description")} rows={2} className={fld} />
        <div className="grid grid-cols-3 gap-2">
          <input type="number" value={f.passingScore} onChange={(e) => set({ passingScore: Number(e.target.value) })} placeholder={t("passingScore")} className={fld} />
          <input type="number" value={f.maxAttempts} onChange={(e) => set({ maxAttempts: Number(e.target.value) })} placeholder={t("maxAttempts")} className={fld} />
          <input type="number" value={f.timeLimitMinutes ?? ""} onChange={(e) => set({ timeLimitMinutes: e.target.value ? Number(e.target.value) : null })} placeholder={t("timeLimit")} className={fld} />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className={chk}><input type="checkbox" checked={f.shuffleQuestions} onChange={(e) => set({ shuffleQuestions: e.target.checked })} /> {t("shuffleQuestions")}</label>
          <label className={chk}><input type="checkbox" checked={f.shuffleOptions} onChange={(e) => set({ shuffleOptions: e.target.checked })} /> {t("shuffleOptions")}</label>
          <label className={chk}><input type="checkbox" checked={f.showCorrectAnswers} onChange={(e) => set({ showCorrectAnswers: e.target.checked })} /> {t("showCorrectAnswers")}</label>
        </div>
        <div className="space-y-2">
          {f.questions.map((q, i) => <QuestionEditor key={q.id} q={q} onChange={(nq) => set({ questions: f.questions.map((x, j) => (j === i ? nq : x)) })} onRemove={() => set({ questions: f.questions.filter((_, j) => j !== i) })} />)}
          <button type="button" onClick={() => set({ questions: [...f.questions, newQ()] })} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold"><Plus className="h-4 w-4" /> {t("addQuestion")}</button>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("cancel")}</button>
          <button type="button" onClick={() => void save()} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("save")}</button></div>
      </div>
    </ScreenModal>
  );
}
