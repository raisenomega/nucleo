import { Moon, Sun } from "lucide-react";
import { useTheme } from "@shared/hooks/useTheme";
import { useI18n } from "@shared/i18n";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t("toggleTheme")}
      className="bg-secondary text-foreground rounded-lg p-2"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
