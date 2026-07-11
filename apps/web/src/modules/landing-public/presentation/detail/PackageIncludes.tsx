import { useI18n } from "@shared/i18n";
import { PackageFeatures } from "@landing-public/presentation/detail/PackageFeatures";
import { PackageIncludedProducts } from "@landing-public/presentation/detail/PackageIncludedProducts";
import { PackageIncludedServices } from "@landing-public/presentation/detail/PackageIncludedServices";
import type { PackageDetail } from "@landing-public/domain/landing-package-detail.types";

// "Qué incluye": beneficios + productos + servicios. Skip-empty por sub-bloque; null si todo vacío.
export function PackageIncludes({ pkg: p }: { pkg: PackageDetail }) {
  const { t } = useI18n();
  const feats = p.features_list ?? [];
  const prods = p.included_products_expanded ?? [];
  const svcs = p.included_services_expanded ?? [];
  if (!feats.length && !prods.length && !svcs.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 font-bold">{t("lpPackageIncludesTitle")}</h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {feats.length > 0 && <PackageFeatures features={feats} />}
        {prods.length > 0 && <PackageIncludedProducts items={prods} />}
        {svcs.length > 0 && <PackageIncludedServices items={svcs} />}
      </div>
    </section>
  );
}
