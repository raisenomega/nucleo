import { supabase } from "@shared/lib/supabase";
import type { LeadFormConfig, LeadSubmit } from "@raisen-marketing/data/lead-form.types";

const r = (o: Record<string, unknown>, k: string) => (o[k] as string) ?? "";
const toCfg = (o: Record<string, unknown>): LeadFormConfig => ({ id: o.id as string, titleEs: r(o, "title_es"), titleEn: r(o, "title_en"), subtitleEs: r(o, "subtitle_es"), subtitleEn: r(o, "subtitle_en"), pillBusinessEs: r(o, "pill_business_es"), pillBusinessEn: r(o, "pill_business_en"), pillPartnerEs: r(o, "pill_partner_es"), pillPartnerEn: r(o, "pill_partner_en"), ctaLabelEs: r(o, "cta_label_es"), ctaLabelEn: r(o, "cta_label_en"), successEs: r(o, "success_es"), successEn: r(o, "success_en"), errorEs: r(o, "error_es"), errorEn: r(o, "error_en"), consentEs: r(o, "consent_es"), consentEn: r(o, "consent_en"), companyLabelEs: r(o, "company_label_es"), companyLabelEn: r(o, "company_label_en"), confSubjectEs: r(o, "confirmation_subject_es"), confSubjectEn: r(o, "confirmation_subject_en"), confBodyEs: r(o, "confirmation_body_es"), confBodyEn: r(o, "confirmation_body_en") });

export async function getLeadFormConfig(): Promise<LeadFormConfig | null> {
  const { data } = await supabase.from("marketing_lead_form_config").select("*").limit(1).maybeSingle();
  return data ? toCfg(data as Record<string, unknown>) : null;
}
export async function saveLeadFormConfig(c: LeadFormConfig): Promise<string | null> {
  const { error } = await supabase.from("marketing_lead_form_config").update({
    title_es: c.titleEs, title_en: c.titleEn, subtitle_es: c.subtitleEs, subtitle_en: c.subtitleEn,
    pill_business_es: c.pillBusinessEs, pill_business_en: c.pillBusinessEn, pill_partner_es: c.pillPartnerEs, pill_partner_en: c.pillPartnerEn,
    cta_label_es: c.ctaLabelEs, cta_label_en: c.ctaLabelEn, success_es: c.successEs, success_en: c.successEn,
    error_es: c.errorEs, error_en: c.errorEn, consent_es: c.consentEs, consent_en: c.consentEn,
    company_label_es: c.companyLabelEs, company_label_en: c.companyLabelEn,
    confirmation_subject_es: c.confSubjectEs, confirmation_subject_en: c.confSubjectEn, confirmation_body_es: c.confBodyEs, confirmation_body_en: c.confBodyEn,
  }).eq("id", c.id);
  return error ? error.message : null;
}

// Crea un lead vía la RPC pública (validación + rate limit en SQL). Captura UTM + source_url de la URL.
export async function submitLead(s: LeadSubmit): Promise<{ ok: boolean; message?: string }> {
  const p = new URLSearchParams(window.location.search);
  const payload = { customer_name: s.customerName, customer_email: s.customerEmail, customer_phone: s.customerPhone, company: s.company, message: s.message, lead_type: s.leadType, lang: s.lang, source_url: window.location.href, utm_source: p.get("utm_source"), utm_medium: p.get("utm_medium"), utm_campaign: p.get("utm_campaign") };
  const { data, error } = await supabase.rpc("_marketing_create_lead", { _payload: payload });
  if (error) return { ok: false, message: error.message };
  const res = data as { status: string; message?: string };
  return res.status === "ok" ? { ok: true } : { ok: false, message: res.message };
}
