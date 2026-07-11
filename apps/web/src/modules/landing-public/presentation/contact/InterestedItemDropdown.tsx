import { useI18n } from "@shared/i18n";
import type { CatalogItem } from "@landing-public/domain/landing-catalog.types";
import type { InterestedItem } from "@landing-public/domain/interested-item.types";

export function InterestedItemDropdown({ value, onChange, products, services, packages, disabled }: {
  value: InterestedItem | null; onChange: (v: InterestedItem | null) => void;
  products: CatalogItem[]; services: CatalogItem[]; packages: CatalogItem[]; disabled?: boolean;
}) {
  const { t } = useI18n();
  const pools: Record<string, CatalogItem[]> = { product: products, service: services, package: packages };
  function pick(v: string) {
    if (!v) return onChange(null);
    const [kind, id] = v.split(":");
    if (!kind) return;
    const it = (pools[kind] ?? []).find((x) => x.id === id);
    if (it) onChange({ kind: kind as InterestedItem["kind"], id: it.id, name: it.name, slug: it.slug });
  }
  const grp = (kind: string, label: string, list: CatalogItem[]) =>
    list.length > 0 && <optgroup label={label}>{list.map((x) => <option key={x.id} value={`${kind}:${x.id}`}>{x.name}</option>)}</optgroup>;
  const fld = "mt-1 w-full rounded-lg border border-[color:var(--glass-border)] bg-transparent p-3 text-sm disabled:opacity-50";
  return (
    <label className="block text-sm font-medium">{t("lpContactInterestedLabel")}
      <select value={value ? `${value.kind}:${value.id}` : ""} disabled={disabled} onChange={(e) => pick(e.target.value)} className={fld}>
        <option value="">{t("lpContactInterestedGeneral")}</option>
        {grp("product", t("lpContactInterestedProducts"), products)}
        {grp("service", t("lpContactInterestedServices"), services)}
        {grp("package", t("lpContactInterestedPackages"), packages)}
      </select>
    </label>
  );
}
