import { ImageUploadWithCrop } from "@shared/components/ImageUploadWithCrop";
import { useI18n } from "@shared/i18n";
import type { SvcSectionProps } from "@landing/presentation/service-modal.hooks";

export function ServiceImageSection({ form, set }: SvcSectionProps) {
  const { t } = useI18n();
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-foreground">{t("primaryImage")}</span>
      <ImageUploadWithCrop entityType="services" aspectRatio={16 / 9} value={form.primaryImageUrl} onUploaded={(u) => set("primaryImageUrl", u)} />
    </div>
  );
}
