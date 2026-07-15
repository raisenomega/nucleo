import { ExternalLink, Copy, Power, Trash2, Pencil } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { ServicePageAdmin } from "@landing/domain/service-page-admin.types";

export function ServicePageRow({ page, onEdit, onDuplicate, onToggle, onDelete }: {
  page: ServicePageAdmin; onEdit: () => void; onDuplicate: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const { t } = useI18n();
  const title = (page.hero.title_es as string) || page.slug;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="truncate font-medium text-foreground">{title}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">/{page.slug}</p>
      </button>
      <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${page.isActive ? "bg-green-500/15 text-green-600" : "bg-muted text-muted-foreground"}`}>{page.isActive ? t("active") : t("spInactive")}</span>
      <div className="flex shrink-0 gap-2 text-muted-foreground">
        <a href={`/servicios/${page.slug}`} target="_blank" rel="noreferrer" aria-label={t("spPreview")}><ExternalLink className="h-4 w-4" /></a>
        <button type="button" onClick={onEdit} aria-label={t("edit")}><Pencil className="h-4 w-4" /></button>
        <button type="button" onClick={onDuplicate} aria-label={t("duplicate")}><Copy className="h-4 w-4" /></button>
        <button type="button" onClick={onToggle} aria-label={t("spToggle")}><Power className="h-4 w-4" /></button>
        <button type="button" onClick={onDelete} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
