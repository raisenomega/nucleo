import { useI18n } from "@shared/i18n";
import { CatalogItemPicker } from "@landing/presentation/CatalogItemPicker";
import type { PkgSectionProps } from "@landing/presentation/package-modal.hooks";
import type { CatalogItem } from "@landing/domain/landing-package.types";

export function PackageIncludedProductsSection({ form, set, items }: PkgSectionProps & { items: CatalogItem[] }) {
  const { t } = useI18n();
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-foreground">{t("includedProducts")}</span>
      <CatalogItemPicker items={items} quantityLabel="pkgUnitsHelp" emptyMessage="pkgEmptyProducts"
        value={form.includedProducts.map((p) => ({ id: p.productId, quantity: p.quantity }))}
        onChange={(v) => set("includedProducts", v.map((x) => ({ productId: x.id, quantity: x.quantity })))} />
    </div>
  );
}
