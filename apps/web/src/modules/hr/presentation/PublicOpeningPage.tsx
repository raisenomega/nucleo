import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { supabaseRecruitmentRepository } from "@hr/infrastructure/supabase-recruitment.repository";
import { PublicApplyForm } from "@hr/presentation/PublicApplyForm";
import { EMP_KEY, SALARY_KEY, payRange } from "@hr/presentation/recruit-ui";
import type { PublicOpening } from "@hr/domain/recruitment.types";

// Página pública de vacante (sin login). undefined = cargando, null = no disponible.
export function PublicOpeningPage({ token }: { token: string }) {
  const { t } = useI18n();
  const [op, setOp] = useState<PublicOpening | null | undefined>(undefined);
  const [doneId, setDoneId] = useState<string | null>(null);
  useEffect(() => { void supabaseRecruitmentRepository.getPublic(token).then(setOp); }, [token]);
  const wrap = "min-h-screen bg-background text-foreground";
  if (op === undefined) return <main className={`${wrap} grid place-items-center p-4`}>{t("loading")}</main>;
  if (op === null) return <main className={`${wrap} grid place-items-center p-4 text-center`}><p className="text-lg font-bold text-primary">{t("positionClosed")}</p></main>;
  if (doneId) return (
    <main className={`${wrap} grid place-items-center p-4 text-center`}>
      <div className="max-w-md space-y-3"><p className="text-3xl">🎉</p>
        <p className="text-lg font-bold text-primary">{t("thankYouForApplying")}</p>
        <p className="text-muted-foreground">{t("applicationSent")}</p>
        <Link to="/screening/$applicantId" params={{ applicantId: doneId }} className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{t("continueApplication")}</Link></div>
    </main>);
  return (
    <main className={wrap}>
      <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-8">
        <header className="space-y-1 border-b border-border pb-4">
          <h1 className="font-display text-2xl font-bold text-foreground">{op.title}</h1>
          <p className="text-sm text-muted-foreground">{[op.department, op.location, t(EMP_KEY[op.employmentType])].filter(Boolean).join(" · ")}{op.isRemote ? ` · ${t("remote")}` : ""}</p>
          {payRange(op.salaryMin, op.salaryMax) && <p className="text-sm font-bold text-foreground">{payRange(op.salaryMin, op.salaryMax)} · {t(SALARY_KEY[op.salaryType])}</p>}
        </header>
        {op.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{op.description}</p>}
        {op.responsibilities && <section><h2 className="font-bold text-foreground">{t("responsibilities")}</h2><p className="whitespace-pre-line text-sm text-muted-foreground">{op.responsibilities}</p></section>}
        {op.requirements.length > 0 && <section><h2 className="font-bold text-foreground">{t("requirements")}</h2><ul className="list-disc pl-5 text-sm text-muted-foreground">{op.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul></section>}
        {op.skills.length > 0 && <section><h2 className="font-bold text-foreground">{t("skills")}</h2><p className="text-sm text-muted-foreground">{op.skills.join(", ")}</p></section>}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">{t("applyNow")}</h2>
          <PublicApplyForm opening={op} onDone={(id) => setDoneId(id)} />
        </div>
      </div>
    </main>
  );
}
