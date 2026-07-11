import { SlugInput } from "@shared/components/SlugInput";
import { MarkdownEditor } from "@shared/components/MarkdownEditor";
import { useI18n } from "@shared/i18n";
import type { PkgSectionProps } from "@landing/presentation/package-modal.hooks";

export function PackageBasicInfoSection({ form, set }: PkgSectionProps) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "mb-1 block text-sm font-medium text-foreground";
  return (
    <div className="space-y-3">
      <SlugInput name={form.name} slug={form.slug} onName={(v) => set("name", v)} onSlug={(v) => set("slug", v)} />
      <div className="flex flex-wrap items-end gap-3">
        <label className="block"><span className={lbl}>{t("badgeLabel")}</span>
          <input value={form.badgeLabel} onChange={(e) => set("badgeLabel", e.target.value)} className={`w-48 ${fld}`} /></label>
        <label className="flex items-center gap-2 pb-2 text-sm text-foreground"><input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> {t("active")}</label>
        <label className="flex items-center gap-2 pb-2 text-sm text-foreground"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /> {t("featured")}</label>
      </div>
      <label className="block"><span className={lbl}>{t("shortDescription")}</span>
        <input value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className={fld} /></label>
      <div><span className={lbl}>{t("longDescription")}</span>
        <MarkdownEditor value={form.longDescription} onChange={(v) => set("longDescription", v)} /></div>
    </div>
  );
}
