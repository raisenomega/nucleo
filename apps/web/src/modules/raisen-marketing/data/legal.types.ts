// Página legal de la landing (camelCase) + link ligero para el footer. La landing lee; /web/legales escribe.
export interface LegalPageRow {
  id: string; slug: string;
  titleEs: string; titleEn: string;
  contentEs: string; contentEn: string;
  isActive: boolean; displayOrder: number;
}
export interface LegalLink { slug: string; titleEs: string; titleEn: string }
export type LegalDraft = Omit<LegalPageRow, "id"> & { id?: string };
