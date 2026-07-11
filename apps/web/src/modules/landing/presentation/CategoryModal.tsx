import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { SlugInput } from "@shared/components/SlugInput";
import { LucideIconPicker } from "@shared/components/LucideIconPicker";
import { ImageUploadWithCrop } from "@shared/components/ImageUploadWithCrop";
import type { LandingCategory, CategoryInput, CategoryType } from "@landing/domain/landing.types";

export function CategoryModal({ initial, onSave, onClose }: {
  initial?: LandingCategory; onSave: (input: CategoryInput) => Promise<void>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [iconName, setIconName] = useState<string | null>(initial?.iconName ?? null);
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [displayOrder, setDisplayOrder] = useState(initial?.displayOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [categoryType, setCategoryType] = useState<CategoryType>(initial?.categoryType ?? "product");
  const [busy, setBusy] = useState(false);
  const sel = "rounded-lg border border-border bg-background p-2 text-sm";
  async function submit() { setBusy(true); await onSave({ name, slug, description, iconName, imageUrl, displayOrder, isActive, categoryType }); setBusy(false); }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("edit") : t("newCategory")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        <SlugInput name={name} slug={slug} onName={setName} onSlug={setSlug} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("description")} rows={2} className={`w-full ${sel}`} />
        <div className="flex flex-wrap items-center gap-3">
          <LucideIconPicker value={iconName} onChange={setIconName} />
          <select value={categoryType} onChange={(e) => setCategoryType(e.target.value as CategoryType)} className={sel}>
            <option value="product">{t("catProduct")}</option><option value="service">{t("catService")}</option><option value="both">{t("catBoth")}</option>
          </select>
          <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} className={`w-20 ${sel}`} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> {t("active")}</label>
        </div>
        <ImageUploadWithCrop entityType="categories" aspectRatio={1} value={imageUrl} onUploaded={setImageUrl} />
        <button type="button" disabled={busy || !name} onClick={() => void submit()}
          className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("save")}</button>
      </div>
    </ScreenModal>
  );
}
