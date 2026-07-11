import { useState } from "react";
import { toPackageInput, derivePackageMode } from "@landing/infrastructure/landing-package.mapper";
import type { LandingPackage, PackageInput, PackageMode } from "@landing/domain/landing-package.types";

export type SetPkg = <K extends keyof PackageInput>(k: K, v: PackageInput[K]) => void;
export type PkgSectionProps = { form: PackageInput; set: SetPkg };

const DEFAULTS: PackageInput = {
  slug: "", name: "", shortDescription: "", longDescription: "",
  price: 0, compareAtPrice: null, currency: "USD",
  includedProducts: [], includedServices: [], featuresList: [],
  primaryImageUrl: null, isActive: true, isFeatured: false, displayOrder: 0,
  badgeLabel: "", metaTitle: "", metaDescription: "", isPublished: false,
};

// Estado + modo (derivado, no persistido) + validación por modo (D1/D8). Warning bundle->simple con items.
export function usePackageForm(initial?: LandingPackage) {
  const [form, setForm] = useState<PackageInput>(initial ? toPackageInput(initial) : DEFAULTS);
  const [mode, setMode] = useState<PackageMode>(initial ? derivePackageMode(initial) : "simple");
  const [warnOpen, setWarnOpen] = useState(false);
  const set: SetPkg = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const hasItems = form.includedProducts.length > 0 || form.includedServices.length > 0;
  const requestMode = (target: PackageMode) => { if (target === "simple" && hasItems) setWarnOpen(true); else setMode(target); };
  const confirmSimple = () => { setMode("simple"); setWarnOpen(false); };
  const canSave = form.name.trim() !== "" && form.slug.trim() !== "" && form.price > 0 && (mode === "simple" || hasItems);
  const submitInput = (): PackageInput => (mode === "simple" ? { ...form, includedProducts: [], includedServices: [] } : form);
  return { form, set, mode, requestMode, warnOpen, confirmSimple, cancelWarn: () => setWarnOpen(false), canSave, submitInput };
}
