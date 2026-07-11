import { useI18n } from "@shared/i18n";
import type { PkgSectionProps } from "@landing/presentation/package-modal.hooks";

export function PackageFeaturesSection({ form, set }: PkgSectionProps) {
  const { t } = useI18n();
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-foreground">{t("features")}</span>
      <textarea value={form.featuresList.join("\n")} onChange={(e) => set("featuresList", e.target.value.split("\n"))}
        rows={4} placeholder={t("featuresHelp")}
        className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
      <p className="mt-1 text-xs text-muted-foreground">{t("featuresHelp")}</p>
    </div>
  );
}
