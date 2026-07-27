import { useCallback, useEffect, useState } from "react";
import { FileText, ClipboardCheck, ArrowRight, Check } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { supabaseScreeningRepository } from "@hr/infrastructure/supabase-screening.repository";
import { DocumentUploader } from "@hr/presentation/DocumentUploader";
import { ExamTaker } from "@hr/presentation/ExamTaker";
import type { ScreeningStatus } from "@hr/domain/screening.types";

// Portal público del candidato (sin login): documentos requeridos + exámenes.
export function ApplicantScreeningPage({ applicantId }: { applicantId: string }) {
  const { t } = useI18n();
  const [s, setS] = useState<ScreeningStatus | null | undefined>(undefined);
  const [exam, setExam] = useState<string | null>(null);
  const load = useCallback(() => { void supabaseScreeningRepository.getStatus(applicantId).then(setS); }, [applicantId]);
  useEffect(load, [load]);
  const wrap = "min-h-screen bg-background text-foreground";
  if (s === undefined) return <main className={`${wrap} grid place-items-center p-4`}>{t("loading")}</main>;
  if (s === null) return <main className={`${wrap} grid place-items-center p-4 text-center`}><p className="text-lg font-bold text-primary">{t("positionClosed")}</p></main>;
  const examBadge = (st: string) => st === "passed" ? "text-green-600" : st === "failed" ? "text-destructive" : "text-amber-600";
  return (
    <main className={wrap}>
      <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-8">
        <header className="space-y-1 border-b border-border pb-3">
          <h1 className="font-display text-2xl font-bold text-foreground">{t("selectionProcess")}</h1>
          <p className="text-sm text-muted-foreground">{s.positionTitle} · {s.applicantName}</p>
          {s.autoRejected && <p className="text-sm font-bold text-destructive">{t("applicationNotAdvanced")}</p>}
        </header>
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 font-bold text-foreground"><FileText className="h-4 w-4" /> {t("documents")}</h2>
          <DocumentUploader applicantId={applicantId} required={s.documents.required} uploaded={s.documents.uploaded} onDone={load} />
        </section>
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 font-bold text-foreground"><ClipboardCheck className="h-4 w-4" /> {t("exams")}</h2>
          {s.exams.length === 0 && <p className="text-sm text-muted-foreground">{t("noRecords")}</p>}
          {s.exams.map((e) => (
            <div key={e.examId} className="flex items-center justify-between rounded-lg border border-border p-2 text-sm">
              <span className="text-foreground">{e.title}</span>
              {e.status === "passed" ? <span className={`flex items-center gap-1 text-xs font-bold ${examBadge(e.status)}`}><Check className="h-4 w-4" /> {e.score}%</span>
                : e.status === "failed" ? <span className={`text-xs font-bold ${examBadge(e.status)}`}>{t("examFailed")}</span>
                : <button type="button" onClick={() => setExam(e.examId)} className="flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">{t("takeExam")} <ArrowRight className="h-3 w-3" /></button>}
            </div>))}
        </section>
      </div>
      {exam && <ExamTaker applicantId={applicantId} examId={exam} onClose={() => { setExam(null); load(); }} />}
    </main>
  );
}
