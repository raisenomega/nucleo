// Footer de la landing (fila única, camelCase). La landing lee; el editor /web/footer escribe.
export interface FooterRow {
  id: string;
  taglineEs: string; taglineEn: string;
  contactEmail: string | null; contactPhone: string | null;
  instagram: string | null; facebook: string | null; linkedin: string | null;
  youtube: string | null; tiktok: string | null; x: string | null;
  copyrightEs: string; copyrightEn: string;
}
