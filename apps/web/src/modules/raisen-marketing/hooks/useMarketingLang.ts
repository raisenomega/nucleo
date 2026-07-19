import { useEffect, useState } from "react";
import type { Lang } from "@raisen-marketing/data/copy";

// Estado de idioma de la landing comercial. Default por navigator.language en mount (en → 'en', resto → 'es').
export function useMarketingLang() {
  const [lang, setLang] = useState<Lang>("es");
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) setLang("en");
  }, []);
  const toggleLang = () => setLang((l) => (l === "es" ? "en" : "es"));
  return { lang, toggleLang };
}
