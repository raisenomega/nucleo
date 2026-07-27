import { useI18n, type TranslationKey } from "@shared/i18n";
import type { Level } from "@finance/application/dash-health";

// Semáforo ÚNICO adaptativo: un solo indicador que cambia de color+texto según el chip activo.
const MAP: Record<Level, { dot: string; text: string; label: TranslationKey }> = {
  g: { dot: "bg-green-500", text: "text-green-600", label: "healthy" },
  y: { dot: "bg-amber-500", text: "text-amber-600", label: "needsAttention" },
  r: { dot: "bg-destructive", text: "text-destructive", label: "critical" },
};

export function DashboardHealth({ level }: { level: Level }) {
  const { t } = useI18n();
  const m = MAP[level];
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${m.dot} ${level !== "g" ? "animate-pulse" : ""}`} />
      <span className="text-sm font-bold text-muted-foreground">{t("healthStatus")}: <span className={m.text}>{t(m.label)}</span></span>
    </div>
  );
}
