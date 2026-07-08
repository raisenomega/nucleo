import type { TranslationKey } from "@shared/i18n";
import type { DocCategory, DocStatus } from "@documents/domain/document.types";

export const DOC_CATEGORIES: DocCategory[] = ["contract", "agreement", "license", "permit", "insurance", "policy", "manual", "certificate", "legal", "other"];
export const DOC_CAT_KEY: Record<DocCategory, TranslationKey> = {
  contract: "dcContract", agreement: "dcAgreement", license: "dcLicense", permit: "dcPermit", insurance: "dcInsurance",
  policy: "dcPolicy", manual: "dcManual", certificate: "dcCertificate", legal: "dcLegal", other: "dcOther",
};
export const DOC_ST_KEY: Record<DocStatus, TranslationKey> = { draft: "dsDraft", active: "dsActive", expired: "dsExpired", cancelled: "dsCancelled" };
export const DOC_ST_COLOR: Record<DocStatus, string> = {
  draft: "bg-secondary", active: "bg-green-100 text-green-800", expired: "bg-red-100 text-red-800", cancelled: "bg-secondary",
};
