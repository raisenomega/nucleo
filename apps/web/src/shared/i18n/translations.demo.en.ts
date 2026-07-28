import type { TranslationKey } from "./translations.keys";

// Demo mode namespace (BLOQUE-A).
export const enDemo = {
  demoBannerText: "Demo account — Data resets every 24 hours.",
  demoOwnerMode: "Owner mode",
  demoOwnerActive: "Owner mode active — Your changes are permanent.",
  demoExitOwner: "Exit",
  demoOwnerTitle: "Owner Mode",
  demoVerify: "Verify",
  demoOwnerNote: "Changes in owner mode are permanent (not wiped on reset).",
  demoPinBad: "Wrong PIN",
  demoOwnerOn: "Owner mode active ✅",
} satisfies Partial<Record<TranslationKey, string>>;
