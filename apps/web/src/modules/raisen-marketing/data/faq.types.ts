// FAQ de la landing comercial. Esta tabla es la ÚNICA fuente del acordeón visible Y del JSON-LD FAQPage:
// si divergieran, Google trataría el structured data como contenido no visible (incumplimiento).
export interface FaqRow {
  id: string;
  questionEs: string; questionEn: string;
  answerEs: string; answerEn: string;
  isActive: boolean; displayOrder: number;
}
export interface FaqConfig { id: string; eyebrowEs: string; eyebrowEn: string; titleEs: string; titleEn: string }
export type FaqDraft = Omit<FaqRow, "id"> & { id?: string };
