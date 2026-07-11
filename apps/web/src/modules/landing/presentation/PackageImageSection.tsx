import { ImageUploadWithCrop } from "@shared/components/ImageUploadWithCrop";
import { useI18n } from "@shared/i18n";
import type { PkgSectionProps } from "@landing/presentation/package-modal.hooks";

export function PackageImageSection({ form, set }: PkgSectionProps) {
  const { t } = useI18n();
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-foreground">{t("primaryImage")}</span>
      <ImageUploadWithCrop entityType="packages" aspectRatio={16 / 9} value={form.primaryImageUrl} onUploaded={(u) => set("primaryImageUrl", u)} />
    </div>
  );
}
