import { useI18n } from "@shared/i18n";
import { highlightIcon } from "@landing-public/utils/highlight-icon";
import type { ItemHighlight } from "@shared/types/item-highlight.types";

// Checklist de puntos destacados con icono Lucide + texto según locale. Si vacío no renderiza.
export function ItemHighlightsChecklist({ highlights, compact }: { highlights: ItemHighlight[]; compact?: boolean }) {
  const { locale } = useI18n();
  if (!highlights?.length) return null;
  return (
    <ul className={compact ? "mt-2 space-y-1" : "space-y-2"}>
      {highlights.map((h, i) => {
        const Ic = highlightIcon(h.icon);
        const text = (locale === "en" ? h.text_en : h.text_es) || h.text_es;
        return (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground">
            <Ic className="mt-0.5 h-4 w-4 shrink-0 text-[color:hsl(var(--tenant-accent-hsl))]" />
            <span>{text}</span>
          </li>);
      })}
    </ul>
  );
}
