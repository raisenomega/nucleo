// R3 · esquema de edición por tipo de bloque (los 14). El editor (BlockDialog) lo lee para renderizar los
// campos; los bloques con arrays (benefits/testimonials/pricing/faq/logo_bar/features_grid) declaran un `array`.
// Todo se guarda como string en el content_es (los renderers coercen números/bools) → editor uniforme.
export type FieldKind = "text" | "area" | "bool";
export interface FieldDef { key: string; label: string; kind?: FieldKind }
export interface ArraySpec { key: string; itemLabel: string; stringItem?: boolean; itemFields: FieldDef[] }
export interface BlockSchema { simple: FieldDef[]; array?: ArraySpec }

const F = (key: string, label: string, kind?: FieldKind): FieldDef => ({ key, label, kind });

export const SCHEMAS: Record<string, BlockSchema> = {
  hero: { simple: [F("headline", "Headline"), F("subtitle", "Subtítulo"), F("cta_label", "CTA texto"), F("cta_action", "CTA acción (#form o URL)"), F("background_image_url", "Imagen de fondo (URL)"), F("overlay_opacity", "Opacidad overlay 0-1")] },
  text: { simple: [F("content", "Texto (una línea = un párrafo)", "area"), F("alignment", "Alineación (left/center)")] },
  cta_banner: { simple: [F("headline", "Headline"), F("cta_label", "CTA texto"), F("cta_action", "CTA acción"), F("style", "Estilo (primary/secondary)")] },
  form: { simple: [F("title", "Título"), F("subtitle", "Subtítulo"), F("fields", "Campos (coma: name,email,phone,company,message)"), F("cta_label", "Botón"), F("success_message", "Mensaje de éxito"), F("consent_text", "Consentimiento"), F("redirect_url", "Redirect (opcional)")] },
  benefits: { simple: [F("title", "Título")], array: { key: "items", itemLabel: "Beneficio", stringItem: true, itemFields: [F("", "Texto")] } },
  image: { simple: [F("image_url", "Imagen (URL)"), F("caption", "Caption"), F("alt_text", "Alt text"), F("max_width", "Ancho máx (ej: 640px)")] },
  video: { simple: [F("video_url", "Video (YouTube/Vimeo/.mp4)"), F("poster_url", "Poster (URL)"), F("autoplay", "Autoplay", "bool")] },
  testimonials: { simple: [], array: { key: "items", itemLabel: "Testimonio", itemFields: [F("quote", "Cita"), F("name", "Nombre"), F("role", "Rol"), F("avatar_url", "Avatar URL"), F("rating", "Rating 1-5")] } },
  pricing: { simple: [], array: { key: "items", itemLabel: "Plan", itemFields: [F("name", "Nombre"), F("price", "Precio"), F("currency", "Moneda ($)"), F("period", "Período (mes/año)"), F("features", "Features (coma)"), F("cta_label", "CTA"), F("cta_action", "CTA acción"), F("highlighted", "Destacado", "bool")] } },
  faq: { simple: [], array: { key: "items", itemLabel: "Pregunta", itemFields: [F("question", "Pregunta"), F("answer", "Respuesta", "area")] } },
  countdown: { simple: [F("headline", "Headline"), F("target_date", "Fecha objetivo (ISO: 2026-08-15T23:59)"), F("expired_text", "Texto al expirar")] },
  divider: { simple: [F("style", "Estilo (line/gradient/space)"), F("height", "Altura (ej: 40px)")] },
  logo_bar: { simple: [], array: { key: "items", itemLabel: "Logo", itemFields: [F("image_url", "Imagen (URL)"), F("alt_text", "Alt"), F("link_url", "Enlace (opcional)")] } },
  features_grid: { simple: [F("columns", "Columnas (2/3/4)")], array: { key: "items", itemLabel: "Feature", itemFields: [F("icon_name", "Ícono Lucide (Zap, Shield, Rocket, Bot…)"), F("title", "Título"), F("description", "Descripción")] } },
};
