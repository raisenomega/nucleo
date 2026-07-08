import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (Documents & contracts). Merged in translations.ts.
export const enDocs = {
  documentsSubtitle: "Contracts, licenses, permits and policies with expirations",
  docTitle: "Document title", newDocument: "New document", parties: "Parties (comma)", tags: "Tags (comma)",
  effectiveDate: "Effective date", expiringSoon: "document(s) expiring soon", renew: "Renew", allTypes: "All types",
  dcContract: "Contract", dcAgreement: "Agreement", dcLicense: "License", dcPermit: "Permit", dcInsurance: "Insurance",
  dcPolicy: "Policy", dcManual: "Manual", dcCertificate: "Certificate", dcLegal: "Legal", dcOther: "Other",
  dsDraft: "Draft", dsActive: "Active", dsExpired: "Expired", dsCancelled: "Cancelled",
} satisfies Partial<Record<TranslationKey, string>>;
