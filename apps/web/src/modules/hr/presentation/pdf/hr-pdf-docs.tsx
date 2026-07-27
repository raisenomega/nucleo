import type { ReactElement } from "react";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import { CLASS_KEY } from "@hr/presentation/eval-ui";
import type { EvaluationDetail as ED } from "@hr/domain/evaluation.types";

// Loaders HR: import dinámico + labels traducidos por el caller (react-pdf nunca en el bundle principal/SSR).
type T = (k: TranslationKey) => string;

export async function certificateDoc(
  data: { employeeName: string; courseName: string; completedAt: string; score: number | null }, brand: PdfBrand, t: T,
): Promise<ReactElement> {
  const { CertificatePdf } = await import("@hr/presentation/pdf/CertificatePdf");
  const labels = { docLabel: t("docCertificate"), title: t("certTitle"), certifies: t("certCertifies"),
    completed: t("certCompleted"), score: t("score"), authorized: t("certAuthorized") };
  return <CertificatePdf brand={brand} data={data} labels={labels} />;
}

export async function evaluationDoc(ev: ED, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { EvaluationPdf } = await import("@hr/presentation/pdf/EvaluationPdf");
  const data = { employeeName: ev.employeeName, period: ev.period, compositeScore: ev.compositeScore,
    classification: ev.classification ? t(CLASS_KEY[ev.classification]) : ev.status, inProbation: ev.inProbation,
    requiresLegal: ev.requiresLegalValidation, notes: ev.notes, scores: ev.scores.map((s) => ({ label: s.label, score: s.score })) };
  const labels = { title: t("evalDocTitle"), period: t("period"), probation: t("evalProbation"), criterion: t("criterion"),
    score: t("score"), legalTitle: t("evalLegalTitle"), legalBody: t("legalWarning"), notes: t("notes") };
  return <EvaluationPdf brand={brand} data={data} labels={labels} />;
}
