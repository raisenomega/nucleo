// Bloque de "Soluciones" (camelCase) + config de la sección. La landing lee; /web/soluciones escribe.
export type PillPreset = "business" | "partner";
export interface SolutionRow {
  id: string; iconName: string;
  titleEs: string; titleEn: string;
  descEs: string; descEn: string;
  bulletsEs: string[]; bulletsEn: string[];
  ctaLabelEs: string; ctaLabelEn: string; ctaHref: string;
  pillPreset: PillPreset | null;
  isHighlighted: boolean; badgeEs: string | null; badgeEn: string | null;
  isActive: boolean; displayOrder: number;
}
export interface SolutionsConfig { id: string; eyebrowEs: string; eyebrowEn: string; titleEs: string; titleEn: string }
export type SolutionDraft = Omit<SolutionRow, "id"> & { id?: string };
