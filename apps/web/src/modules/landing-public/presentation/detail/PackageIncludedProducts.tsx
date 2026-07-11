import { useI18n } from "@shared/i18n";
import { MiniItemCard } from "@landing-public/presentation/detail/MiniItemCard";
import type { IncludedItem } from "@landing-public/domain/landing-package-detail.types";

export function PackageIncludedProducts({ items }: { items: IncludedItem[] }) {
  const { t } = useI18n();
  return (
    <div>
      <h3 className="mb-3 font-bold">{t("lpPackageIncludedProductsTitle")}</h3>
      <div className="grid grid-cols-1 gap-3">
        {items.map((x) => <MiniItemCard key={x.slug} imageUrl={x.primary_image_url} name={x.name} qtyLabel={t("lpPackageQtyUnits", { qty: x.quantity })} to="/product/$slug" slug={x.slug} />)}
      </div>
    </div>
  );
}
