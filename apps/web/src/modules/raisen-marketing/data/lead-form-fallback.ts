import type { LeadFormConfig } from "@raisen-marketing/data/lead-form.types";

// Fallback de la config del form (idéntico al seed de la migr 203). La landing lo usa hasta que la DB responde.
export const LEAD_FORM_FALLBACK: LeadFormConfig = {
  id: "",
  titleEs: "Hablemos de tu negocio", titleEn: "Let's talk about your business",
  subtitleEs: "Déjanos tus datos y te contactamos.", subtitleEn: "Leave your details and we'll reach out.",
  pillBusinessEs: "Para mi negocio", pillBusinessEn: "For my business",
  pillPartnerEs: "Quiero ser partner", pillPartnerEn: "I want to be a partner",
  ctaLabelEs: "Enviar", ctaLabelEn: "Send",
  successEs: "¡Gracias! Te contactaremos pronto.", successEn: "Thanks! We'll be in touch soon.",
  errorEs: "No pudimos enviar tu mensaje. Intenta de nuevo.", errorEn: "We couldn't send your message. Please try again.",
  consentEs: "Al enviar aceptas que te contactemos sobre tu solicitud.", consentEn: "By submitting you agree to be contacted about your request.",
  companyLabelEs: "Empresa (opcional)", companyLabelEn: "Company (optional)",
  confSubjectEs: "Recibimos tu solicitud — NÚCLEO", confSubjectEn: "We received your request — NÚCLEO",
  confBodyEs: "Gracias por tu interés. Recibimos tu solicitud y te contactaremos muy pronto.", confBodyEn: "Thanks for your interest. We received your request and will contact you very soon.",
};
