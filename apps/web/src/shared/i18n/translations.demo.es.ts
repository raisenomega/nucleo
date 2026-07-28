import type { TranslationKey } from "./translations.keys";

// Namespace del modo demo (BLOQUE-A).
export const esDemo = {
  demoBannerText: "Cuenta de demostración — Los datos se reinician cada 24 horas.",
  demoOwnerMode: "Modo owner",
  demoOwnerActive: "Modo owner activo — Tus cambios son permanentes.",
  demoExitOwner: "Salir",
  demoOwnerTitle: "Modo Owner",
  demoVerify: "Verificar",
  demoOwnerNote: "Los cambios en modo owner son permanentes (no se borran en el reset).",
  demoPinBad: "PIN incorrecto",
  demoOwnerOn: "Modo owner activo ✅",
} satisfies Partial<Record<TranslationKey, string>>;
