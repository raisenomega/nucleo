import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { supabaseScreeningRepository } from "@hr/infrastructure/supabase-screening.repository";
import { ExamQuestionField } from "@hr/presentation/ExamQuestionField";
import type { PublicExam, ExamResult, Answer } from "@hr/domain/screening.types";

export function ExamTaker({ applicantId, examId, onClose }: { applicantId: string; examId: string; onClose: () => void }) {
  const { t } = useI18n();
  const [exam, setExam] = useState<PublicExam | null | undefined>(undefined);
  const [ans, setAns] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<ExamResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { void supabaseScreeningRepository.getExam(applicantId, examId).then(setExam); }, [applicantId, examId]);
  async function submit() {
    setBusy(true);
    const r = await supabaseScreeningRepository.submitExam(applicantId, examId, ans);
    setBusy(false);
    if ("error" in r) setErr(r.error); else setResult(r);
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{exam?.title ?? t("exams")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        {exam === undefined ? <p className="text-muted-foreground">{t("loading")}</p>
          : exam === null || exam.status === "not_found" ? <p className="text-destructive">{t("positionClosed")}</p>
          : result ? (
            <div className="space-y-2 text-center">
              <p className={`text-3xl font-bold ${result.passed ? "text-green-600" : "text-destructive"}`}>{result.score}%</p>
              <p className="font-bold">{result.passed ? t("examPassed") : t("examFailed")}</p>
              {!result.passed && result.attemptsUsed < result.maxAttempts && <p className="text-sm text-muted-foreground">{t("attemptsLeft")}: {result.maxAttempts - result.attemptsUsed}</p>}
              <button type="button" onClick={onClose} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("cancel")}</button>
            </div>
          ) : exam.status !== "available" ? (
            <p className="text-center font-bold">{exam.status === "passed" ? `${t("examPassed")} · ${exam.score}%` : t("noAttemptsLeft")}</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{t("passingScore")}: {exam.passingScore}% · {t("attemptsLeft")}: {exam.maxAttempts - exam.attemptsUsed}</p>
              {exam.questions?.map((q, i) => <ExamQuestionField key={q.id} q={q} index={i} value={ans[q.id]} onChange={(v) => setAns((p) => ({ ...p, [q.id]: v }))} />)}
              {err && <p className="text-sm text-destructive">{err}</p>}
              <button type="button" disabled={busy} onClick={() => void submit()} className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50">{t("submitExam")}</button>
            </>
          )}
      </div>
    </ScreenModal>
  );
}
