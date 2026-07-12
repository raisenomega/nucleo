import { AlertTriangle } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { depCount, type FormDeps } from "@order-forms/domain/order-form.types";

export function DependencyWarningModal({ deps, onClose }: { deps: FormDeps; onClose: () => void }) {
  const { t } = useI18n();
  const group = (labelKey: "products" | "ofServices" | "ofPackages", items: { id: string; name: string }[], title: string) =>
    items.length > 0 && (
      <div key={labelKey}><p className="text-xs font-bold uppercase text-muted-foreground">{title}</p>
        <ul className="list-inside list-disc text-sm text-foreground">{items.map((i) => <li key={i.id}>{i.name}</li>)}</ul></div>
    );
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" /><h2 className="font-display text-lg font-bold">{t("ofDepsTitle")}</h2></div>
        <p className="text-sm text-muted-foreground">{t("ofDepsBody", { n: depCount(deps) })}</p>
        <div className="space-y-2 rounded-lg border border-border p-3">
          {group("products", deps.products, t("products"))}
          {group("ofServices", deps.services, t("services"))}
          {group("ofPackages", deps.packages, t("packages"))}
        </div>
        <button type="button" onClick={onClose} className="w-full rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground">{t("ofClose")}</button>
      </div>
    </ScreenModal>
  );
}
