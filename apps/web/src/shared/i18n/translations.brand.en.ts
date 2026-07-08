import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (Templates/branding tab). Merged in translations.ts.
export const enBrand = {
  templatesTab: "Templates", identitySection: "Company identity",
  legalNameLbl: "Legal name", tradeName: "Trade name", website: "Website", taxId: "Tax ID / EIN",
  colorsSection: "Colors & style", primaryColor: "Primary color", accentColor: "Accent color",
  pdfPreview: "PDF header preview", logoLbl: "Logo",
  templatesSection: "PDF templates",
  templatesFuture: "Soon you will be able to choose styles: classic, modern, minimalist.",
} satisfies Partial<Record<TranslationKey, string>>;
