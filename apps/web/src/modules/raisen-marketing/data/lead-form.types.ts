// Config editable del form comercial + lead capturado (camelCase). La landing lee config + crea leads vía
// RPC; el editor /web/leads lee/gestiona leads y edita la config.
export interface LeadFormConfig {
  id: string;
  titleEs: string; titleEn: string; subtitleEs: string; subtitleEn: string;
  pillBusinessEs: string; pillBusinessEn: string; pillPartnerEs: string; pillPartnerEn: string;
  ctaLabelEs: string; ctaLabelEn: string; successEs: string; successEn: string;
  errorEs: string; errorEn: string; consentEs: string; consentEn: string;
}
export type LeadStatus = "new" | "contacted" | "qualified" | "archived";
export interface MarketingLead {
  id: string; leadType: "business" | "partner"; customerName: string; customerEmail: string;
  customerPhone: string | null; businessType: string | null; message: string | null; sourceUrl: string | null;
  utmSource: string | null; utmMedium: string | null; utmCampaign: string | null;
  status: LeadStatus; notes: string | null; createdAt: string;
}
export interface LeadSubmit { customerName: string; customerEmail: string; customerPhone: string; message: string; leadType: "business" | "partner" }
