import { AlertTriangle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { RES_ICON, RES_KEY, formatBytes } from "@hr/presentation/res-ui";
import type { Resource } from "@hr/domain/resource.types";

// Tarjeta de recurso: icono por tipo + título + tipo/tamaño(o provider) + categoría. Click → viewer.
export function ResourceCard({ res, onOpen }: { res: Resource; onOpen: (r: Resource) => void }) {
  const { t } = useI18n();
  const Icon = RES_ICON[res.resourceType];
  const meta = res.resourceType === "video" ? (res.videoProvider ?? "video")
    : res.resourceType === "link" ? t("link") : formatBytes(res.fileSize) || t(RES_KEY[res.resourceType]);
  return (
    <button type="button" onClick={() => onOpen(res)}
      className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground"><Icon className="h-5 w-5" /></span>
      <span className="line-clamp-2 text-sm font-bold text-foreground">{res.title}</span>
      <span className="text-xs text-muted-foreground">{t(RES_KEY[res.resourceType])} · {meta}</span>
      {res.category && <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{res.category}</span>}
      {res.isRequired && <span title={t("requiredMaterial")} className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
        <AlertTriangle className="h-3 w-3" /> {t("requiredMaterial")}</span>}
    </button>
  );
}
