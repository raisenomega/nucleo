export type Locale = "es" | "en";
export type TranslationKey = "title" | "tagline" | "toggleTheme" | "switchLang";

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  es: {
    title: "NÚCLEO by raisen",
    tagline: "La base operativa de tu negocio",
    toggleTheme: "Cambiar tema",
    switchLang: "Cambiar idioma",
  },
  en: {
    title: "NÚCLEO by raisen",
    tagline: "The operating core for your business",
    toggleTheme: "Toggle theme",
    switchLang: "Switch language",
  },
};
