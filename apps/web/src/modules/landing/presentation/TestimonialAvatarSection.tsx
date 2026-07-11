import { ImageUploadWithCrop } from "@shared/components/ImageUploadWithCrop";
import { useI18n } from "@shared/i18n";
import type { TSectionProps } from "@landing/presentation/testimonial-modal.hooks";

export function TestimonialAvatarSection({ form, set }: TSectionProps) {
  const { t } = useI18n();
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-foreground">{t("avatar")}</span>
      <ImageUploadWithCrop entityType="testimonials" aspectRatio={1} value={form.avatarUrl} onUploaded={(u) => set("avatarUrl", u)} />
    </div>
  );
}
