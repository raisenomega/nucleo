import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";

const OPTS: [string, TranslationKey][] = [["light", "lightMode"], ["dark", "darkMode"], ["auto", "autoMode"]];

// Sección Modo por defecto: claro / oscuro / automático (NULL = respeta preferencia del sistema/usuario).
export function ThemeModeSection({ mode, onChange }: { mode: string | null; onChange: (v: string | null) => void }) {
  const { t } = useI18n();
  const current = mode ?? "auto";
  return (
    <div className="space-y-2">
      {OPTS.map(([val, lbl]) => (
        <label key={val} className="flex items-center gap-2 text-sm">
          <input type="radio" name="default_mode" checked={current === val}
            onChange={() => onChange(val === "auto" ? null : val)} />
          {t(lbl)}
        </label>
      ))}
    </div>
  );
}
