import { useState } from "react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { applyTheme, getTheme, type Theme } from "@shared/portal/portal-theme";

const OPTS: Theme[] = ["light", "dark", "auto"];
const LABEL: Record<Theme, TranslationKey> = { light: "pThemeLight", dark: "pThemeDark", auto: "pThemeAuto" };

// Selector de tema del portal (claro/oscuro/auto). Aplica y persiste al instante.
export function PortalThemeToggle() {
  const { t } = useI18n();
  const [th, setTh] = useState<Theme>(getTheme());
  const pick = (v: Theme) => { setTh(v); applyTheme(v); };
  return (
    <div className="flex gap-2">
      {OPTS.map((o) => <button key={o} type="button" onClick={() => pick(o)} className={`rounded-lg px-3 py-1.5 text-sm ${th === o ? "bg-primary font-bold text-primary-foreground" : "bg-secondary text-foreground"}`}>{t(LABEL[o])}</button>)}
    </div>
  );
}
