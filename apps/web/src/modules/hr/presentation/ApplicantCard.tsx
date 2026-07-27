import { ArrowRight, X, UserCheck } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { daysAgo } from "@hr/presentation/recruit-ui";
import type { Applicant } from "@hr/domain/recruitment.types";

// Card de candidato en el Kanban. Sin drag&drop: botones "Avanzar →" / "Contratar" (en oferta) / "✗ Rechazar".
export function ApplicantCard({ a, isOffer, done, onOpen, onAdvance, onReject }: {
  a: Applicant; isOffer: boolean; done?: boolean; onOpen: () => void; onAdvance: () => void; onReject: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-1 rounded-lg border border-border bg-card p-2 text-xs">
      <button type="button" onClick={onOpen} className="block w-full truncate text-left font-semibold text-foreground hover:underline">{a.fullName}</button>
      <p className="truncate text-muted-foreground">{a.email}</p>
      <p className="text-muted-foreground">{t("documents")}: {a.documentsUploaded.length} · {t("score")}: {a.interviewScore != null ? a.interviewScore.toFixed(1) : "—"}</p>
      <p className="text-muted-foreground">{daysAgo(a.createdAt)} {t("daysUnit")}</p>
      {done ? <p className="flex items-center gap-1 pt-1 font-bold text-green-600"><UserCheck className="h-3 w-3" /> {t("hired")}</p> : (
        <div className="flex gap-1 pt-1">
          <button type="button" onClick={onAdvance} className="flex flex-1 items-center justify-center gap-1 rounded bg-primary px-2 py-1 font-bold text-primary-foreground">
            {isOffer ? <><UserCheck className="h-3 w-3" /> {t("hireApplicant")}</> : <>{t("advance")} <ArrowRight className="h-3 w-3" /></>}</button>
          <button type="button" onClick={onReject} aria-label={t("reject")} className="rounded bg-secondary px-2 py-1 text-destructive"><X className="h-3 w-3" /></button>
        </div>)}
    </div>
  );
}
