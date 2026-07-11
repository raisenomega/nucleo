import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { usePackageForm } from "@landing/presentation/package-modal.hooks";
import { useLandingCatalog } from "@landing/application/useLandingCatalog.hook";
import { PackageModeToggleSection } from "@landing/presentation/PackageModeToggleSection";
import { PackageBasicInfoSection } from "@landing/presentation/PackageBasicInfoSection";
import { PackagePricingSection } from "@landing/presentation/PackagePricingSection";
import { PackageIncludedProductsSection } from "@landing/presentation/PackageIncludedProductsSection";
import { PackageIncludedServicesSection } from "@landing/presentation/PackageIncludedServicesSection";
import { PackageFeaturesSection } from "@landing/presentation/PackageFeaturesSection";
import { PackageImageSection } from "@landing/presentation/PackageImageSection";
import { PackageMetaSection } from "@landing/presentation/PackageMetaSection";
import type { ILandingProductsRepository, ILandingServicesRepository } from "@landing/domain/landing.types";
import type { LandingPackage, PackageInput } from "@landing/domain/landing-package.types";

export function PackageModal({ initial, productsRepo, servicesRepo, onSave, onClose }: {
  initial?: LandingPackage; productsRepo: ILandingProductsRepository; servicesRepo: ILandingServicesRepository;
  onSave: (input: PackageInput) => Promise<void>; onClose: () => void;
}) {
  const { t } = useI18n();
  const f = usePackageForm(initial);
  const [busy, setBusy] = useState(false);
  const cat = useLandingCatalog(productsRepo, servicesRepo, f.mode === "bundle");
  async function submit() { setBusy(true); await onSave(f.submitInput()); setBusy(false); }
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{initial ? t("edit") : t("newPackage")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4 text-foreground">
        <PackageModeToggleSection mode={f.mode} requestMode={f.requestMode} warnOpen={f.warnOpen} confirmSimple={f.confirmSimple} cancelWarn={f.cancelWarn} />
        <PackageBasicInfoSection form={f.form} set={f.set} />
        <PackagePricingSection form={f.form} set={f.set} />
        {f.mode === "bundle" && <PackageIncludedProductsSection form={f.form} set={f.set} items={cat.products} />}
        {f.mode === "bundle" && <PackageIncludedServicesSection form={f.form} set={f.set} items={cat.services} />}
        <PackageFeaturesSection form={f.form} set={f.set} />
        <PackageImageSection form={f.form} set={f.set} />
        <PackageMetaSection form={f.form} set={f.set} />
        <button type="button" disabled={busy || !f.canSave} onClick={() => void submit()}
          className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground disabled:opacity-50">{busy ? t("sending") : t("save")}</button>
      </div>
    </ScreenModal>
  );
}
