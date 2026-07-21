import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (Templates/branding tab). Merged in translations.ts.
export const enBrand = {
  templatesTab: "Templates", identitySection: "Company identity",
  legalNameLbl: "Legal name", tradeName: "Trade name", website: "Website", taxId: "Tax ID / EIN",
  colorsSection: "Colors & style", primaryColor: "Primary color", accentColor: "Accent color",
  pdfPreview: "PDF header preview", logoLbl: "Logo",
  templatesSection: "PDF templates",
  templatesFuture: "Soon you will be able to choose styles: classic, modern, minimalist.",
  // ── /settings/themes ──
  themesTab: "Themes", themesTitle: "Customize your brand", themesSubtitle: "Changes affect how the platform looks for your team.",
  identityHeader: "Identity", shortNameLbl: "Short name", shortNameHelp: "Shown in the sidebar and browser tab title.",
  faviconLbl: "Favicon", assetsHelp: "PNG, JPG, WebP or SVG. Max 3 MB.",
  colorsHeader: "Colors", secondaryColor: "Secondary color",
  sidebarBg: "Sidebar background", sidebarText: "Sidebar text", sidebarHover: "Sidebar hover",
  dangerColor: "Error color", successColor: "Success color", warningColor: "Warning color",
  defaultModeHeader: "Default mode", lightMode: "Light", darkMode: "Dark", autoMode: "Automatic — follow system",
  restoreSectionDefaults: "Restore this section's defaults", cancelBtn: "Cancel", saveBtn: "Save changes",
  saveSuccess: "Changes saved.", saveErrorFull: "Could not save the changes.",
  saveErrorPartial: "Identity was saved, but colors were not. Retry.",
  fileTooLarge: "File too large. Max 3 MB.",
  fileFormatUnsupported: "Unsupported format. Use PNG, JPG, WebP or SVG.",
} satisfies Partial<Record<TranslationKey, string>>;
