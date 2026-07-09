import { useI18n } from "@shared/i18n";

// Badge "VOID" con tooltip (title) mostrando quién anuló, cuándo y el motivo.
export function VoidedBadge({ name, date, reason }: { name?: string; date?: string | null; reason?: string | null }) {
  const { t } = useI18n();
  const d = date ? date.slice(0, 10) : "";
  const tip = t("voidedTooltip").replace("{name}", name || "—").replace("{date}", d)
    + " · " + t("voidedReasonTooltip").replace("{reason}", reason || "—");
  return (
    <span title={tip} className="rounded bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground no-underline">
      {t("voidedBadge")}
    </span>
  );
}
