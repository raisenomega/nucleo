import { useI18n } from "@shared/i18n";
import { CatalogItemPicker } from "@landing/presentation/CatalogItemPicker";
import type { PkgSectionProps } from "@landing/presentation/package-modal.hooks";
import type { CatalogItem } from "@landing/domain/landing-package.types";

export function PackageIncludedServicesSection({ form, set, items }: PkgSectionProps & { items: CatalogItem[] }) {
  const { t } = useI18n();
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-foreground">{t("includedServices")}</span>
      <CatalogItemPicker items={items} quantityLabel="pkgSessionsHelp" emptyMessage="pkgEmptyServices"
        value={form.includedServices.map((s) => ({ id: s.serviceId, quantity: s.quantity }))}
        onChange={(v) => set("includedServices", v.map((x) => ({ serviceId: x.id, quantity: x.quantity })))} />
    </div>
  );
}
