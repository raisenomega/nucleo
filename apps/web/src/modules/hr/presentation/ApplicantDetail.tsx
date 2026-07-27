import { X, UserCheck, ArrowRight } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { DocVerifyList } from "@hr/presentation/DocVerifyList";
import { STAGE_KEY } from "@hr/presentation/recruit-ui";
import type { Applicant } from "@hr/domain/recruitment.types";

export function ApplicantDetail({ a, onClose, onAdvance, onReject, onChanged }: {
  a: Applicant; onClose: () => void; onAdvance: () => void; onReject: () => void; onChanged: () => void;
}) {
  const { t } = useI18n();
  const terminal = ["hired", "rejected", "withdrawn"].includes(a.stage);
  const addr = [a.address, a.city, a.state, a.zipCode].filter(Boolean).join(", ");
  const answers = Object.entries(a.customAnswers);
  const exams = Object.values(a.examScores);
  const examsPassed = exams.filter((e) => e.passed).length;
  const row = (label: string, val: string | null) => (val ? <div><dt className="inline text-muted-foreground">{label}: </dt><dd className="inline">{val}</dd></div> : null);
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{a.fullName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4 text-sm">
        <span className="inline-block rounded bg-secondary px-2 py-0.5 text-xs font-bold">{t(STAGE_KEY[a.stage])}</span>
        <dl className="space-y-1">{row(t("email"), a.email)}{row(t("phone"), a.phone)}{row(t("address"), addr || null)}</dl>
        {a.coverLetter && <div className="rounded-lg bg-secondary p-3"><span className="font-bold">{t("coverLetter")}: </span>{a.coverLetter}</div>}
        <DocVerifyList applicantId={a.id} docs={a.documentsUploaded} onChanged={onChanged} />
        {exams.length > 0 && <p className="text-sm"><span className="font-bold">{t("exams")}: </span>{examsPassed}/{exams.length} {t("examPassedShort")}</p>}
        {answers.length > 0 && <div className="space-y-1">{answers.map(([q, ans]) => <div key={q}><span className="font-bold">{q}: </span>{String(ans)}</div>)}</div>}
        {a.decisionNotes && <div className="rounded-lg bg-secondary p-3"><span className="font-bold">{t("notes")}: </span>{a.decisionNotes}</div>}
        {!terminal && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <button type="button" onClick={onAdvance} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
              {a.stage === "offer" ? <><UserCheck className="h-4 w-4" /> {t("hireApplicant")}</> : <>{t("advance")} <ArrowRight className="h-4 w-4" /></>}</button>
            <button type="button" onClick={onReject} className="rounded-lg bg-secondary px-3 py-2 text-sm font-bold text-destructive">{t("reject")}</button>
          </div>)}
      </div>
    </ScreenModal>
  );
}
