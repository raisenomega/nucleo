// Página dedicada de servicio (tenant_service_pages, resuelta por RPC anon). Contenido bilingüe editable por tenant.
export interface SpUse { icon: string; title_es: string; title_en: string; description_es: string; description_en: string }
export interface SpSpec { icon: string; label_es: string; label_en: string; value_es: string; value_en: string }
export interface SpFaq { category_es: string; category_en: string; question_es: string; question_en: string; answer_es: string; answer_en: string }
export interface SpOption { value: string; label_es: string; label_en: string }
export interface SpField { name: string; kind: string; label_es: string; label_en: string; required: boolean; options?: SpOption[]; placeholder_es?: string; placeholder_en?: string }
export interface SpRequestForm {
  title_es: string; title_en: string; submit_label_es: string; submit_label_en: string;
  success_title_es: string; success_title_en: string; success_message_es: string; success_message_en: string; fields: SpField[];
}
export interface SpHero { badge_es: string; badge_en: string; title_es: string; title_en: string; subtitle_es: string; subtitle_en: string; image_url: string | null; image_alt_es: string; image_alt_en: string }
export interface SpSeo { meta_title_es: string; meta_title_en: string; meta_description_es: string; meta_description_en: string; keywords_es: string; keywords_en: string; og_image: string | null; canonical_path: string }
export interface ServicePage { slug: string; hero: SpHero; uses: SpUse[]; specs: SpSpec[]; faq: SpFaq[]; requestForm: SpRequestForm; seo: SpSeo }
