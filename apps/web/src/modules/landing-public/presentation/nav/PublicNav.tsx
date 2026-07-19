import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Moon, Sun, LogIn } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { NavGlass } from "@landing-public/primitives/NavGlass";

// Nav público: display_name a la izquierda + toggles (dark/lang) a la derecha. El dark toggle controla
// data-theme del <html> (sistema de tema de la landing, no el .dark del panel). Menú de items → 3.E.3.
export function PublicNav({ displayName, logoUrl }: { displayName: string; logoUrl: string | null }) {
  const { t, locale, setLocale } = useI18n();
  const [dark, setDark] = useState(false);
  const toggleTheme = () => {
    const next = !dark; setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };
  const btn = "rounded-lg p-2 text-[color:hsl(var(--lp-fg))] transition-colors hover:bg-black/5";
  return (
    <NavGlass ariaLabel={t("lpNavMenu")}>
      <Link to="/" className="flex items-center gap-2 text-[color:hsl(var(--lp-fg))]">
        {logoUrl && <img src={logoUrl} alt={displayName} className="h-9 w-9 shrink-0 rounded-full object-cover" />}
        <span className="font-display text-lg font-bold">{displayName}</span>
      </Link>
      <div className="flex items-center gap-1">
        <Link to="/catalog" className="hidden rounded-lg px-3 py-2 text-sm font-bold text-[color:hsl(var(--lp-fg))] transition-colors hover:bg-black/5 sm:inline-flex">{t("lpCatalogTitle")}</Link>
        <button type="button" onClick={toggleTheme} aria-label={t("darkMode")} className={btn}>{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        <button type="button" onClick={() => setLocale(locale === "es" ? "en" : "es")} aria-label={t("switchLang")} className={`${btn} text-sm font-bold`}>{locale === "es" ? "EN" : "ES"}</button>
        <Link to="/portal/login" className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--glass-border)] px-3 py-2 text-sm font-bold text-[color:hsl(var(--lp-fg))] transition-colors hover:bg-black/5">
          <LogIn className="h-4 w-4" /><span>{t("lpLogin")}</span>
        </Link>
      </div>
    </NavGlass>
  );
}
