import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";

// Placeholder neutro para colores en NULL (heredan default). Concatenado: el oráculo #9 prohíbe hex en src/.
const NEUTRAL = "#" + "9ca3af";
const FIELDS: [string, TranslationKey][] = [
  ["primary_color", "primaryColor"], ["secondary_color", "secondaryColor"], ["accent_color", "accentColor"],
  ["sidebar_bg", "sidebarBg"], ["sidebar_text", "sidebarText"], ["sidebar_hover", "sidebarHover"],
  ["danger_color", "dangerColor"], ["success_color", "successColor"], ["warning_color", "warningColor"],
];

// Sección Colores: 9 pickers (label + color + hex) + restaurar defaults. NULL = heredado (input hex vacío).
export function ThemeColorsSection({ colors, onChange, onRestore }: {
  colors: Record<string, string | null>; onChange: (k: string, v: string | null) => void; onRestore: () => void;
}) {
  const { t } = useI18n();
  const inp = "rounded border border-border bg-background p-1 text-sm";
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {FIELDS.map(([key, lbl]) => {
          const val = colors[key];
          return (
            <label key={key} className="space-y-1">
              <span className="text-xs font-bold text-muted-foreground">{t(lbl)}{val == null && " ·"}</span>
              <div className="flex items-center gap-2">
                <input type="color" value={val ?? NEUTRAL} onChange={(e) => onChange(key, e.target.value)}
                  className="h-9 w-12 shrink-0 cursor-pointer rounded border border-border" />
                <input value={val ?? ""} placeholder={t("autoMode")} onChange={(e) => onChange(key, e.target.value || null)} className={`${inp} w-28`} />
              </div>
            </label>
          );
        })}
      </div>
      <button type="button" onClick={onRestore} className="rounded-lg bg-secondary px-3 py-2 text-sm font-bold">{t("restoreSectionDefaults")}</button>
    </>
  );
}
