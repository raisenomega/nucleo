// Config editable del form comercial + lead capturado (camelCase). La landing lee config + crea leads vía
// RPC; el editor /web/leads gestiona los leads (CRM) y edita la config.
export interface LeadFormConfig {
  id: string;
  titleEs: string; titleEn: string; subtitleEs: string; subtitleEn: string;
  pillBusinessEs: string; pillBusinessEn: string; pillPartnerEs: string; pillPartnerEn: string;
  ctaLabelEs: string; ctaLabelEn: string; successEs: string; successEn: string;
  errorEs: string; errorEn: string; consentEs: string; consentEn: string;
  companyLabelEs: string; companyLabelEn: string;
}
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost" | "archived";
export type LeadTemperature = "cold" | "warm" | "hot" | "converted";
export interface MarketingLead {
  id: string; leadType: "business" | "partner"; customerName: string; customerEmail: string;
  customerPhone: string | null; company: string | null; whatsappPhone: string | null;
  businessType: string | null; message: string | null; sourceUrl: string | null;
  utmSource: string | null; utmMedium: string | null; utmCampaign: string | null;
  status: LeadStatus; temperature: LeadTemperature; notes: string | null; createdAt: string;
}
export interface LeadSubmit { customerName: string; customerEmail: string; customerPhone: string; company: string; message: string; leadType: "business" | "partner" }
export interface LeadEditFields { customerName: string; customerEmail: string; customerPhone: string; company: string; whatsappPhone: string }
