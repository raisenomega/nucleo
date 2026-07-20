// Testimonio de la landing (camelCase) + config de la sección. La landing lee; /web/testimonios escribe.
export interface TestimonialRow {
  id: string; quoteEs: string; quoteEn: string;
  clientName: string; clientCompany: string | null; clientRole: string | null;
  avatarUrl: string | null; rating: number;
  isActive: boolean; displayOrder: number;
}
export interface TestimonialsConfig { id: string; eyebrowEs: string; eyebrowEn: string; titleEs: string; titleEn: string }
export type TestimonialDraft = Omit<TestimonialRow, "id"> & { id?: string };
