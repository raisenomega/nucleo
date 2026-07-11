import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { NavGlass } from "@landing-public/primitives/NavGlass";

// Nav público: display_name a la izquierda + toggles (dark/lang) a la derecha. El dark toggle controla
// data-theme del <html> (sistema de tema de la landing, no el .dark del panel). Menú de items → 3.E.3.
export function PublicNav({ displayName }: { displayName: string }) {
  const { t, locale, setLocale } = useI18n();
  const [dark, setDark] = useState(false);
  const toggleTheme = () => {
    const next = !dark; setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };
  const btn = "rounded-lg p-2 text-[color:hsl(var(--lp-fg))] transition-colors hover:bg-black/5";
  return (
    <NavGlass ariaLabel={t("lpNavMenu")}>
      <Link to="/" className="font-display text-lg font-bold text-[color:hsl(var(--lp-fg))]">{displayName}</Link>
      <div className="flex items-center gap-1">
        <button type="button" onClick={toggleTheme} aria-label={t("darkMode")} className={btn}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        <button type="button" onClick={() => setLocale(locale === "es" ? "en" : "es")} aria-label={t("switchLang")} className={`${btn} text-sm font-bold`}>{locale === "es" ? "EN" : "ES"}</button>
      </div>
    </NavGlass>
  );
}
