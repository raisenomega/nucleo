import { useI18n } from "@shared/i18n";
import type { CatalogItem } from "@landing-public/domain/landing-catalog.types";
import type { InterestedItem } from "@landing-public/domain/interested-item.types";

export function InterestedItemDropdown({ value, onChange, products, services, disabled }: {
  value: InterestedItem | null; onChange: (v: InterestedItem | null) => void;
  products: CatalogItem[]; services: CatalogItem[]; disabled?: boolean;
}) {
  const { t } = useI18n();
  function pick(v: string) {
    if (!v) return onChange(null);
    const [kind, id] = v.split(":");
    const it = (kind === "product" ? products : services).find((x) => x.id === id);
    if (it) onChange({ kind: kind as "product" | "service", id: it.id, name: it.name, slug: it.slug });
  }
  const fld = "mt-1 w-full rounded-lg border border-[color:var(--glass-border)] bg-transparent p-3 text-sm disabled:opacity-50";
  return (
    <label className="block text-sm font-medium">{t("lpContactInterestedLabel")}
      <select value={value ? `${value.kind}:${value.id}` : ""} disabled={disabled} onChange={(e) => pick(e.target.value)} className={fld}>
        <option value="">{t("lpContactInterestedGeneral")}</option>
        {products.length > 0 && <optgroup label={t("lpContactInterestedProducts")}>{products.map((p) => <option key={p.id} value={`product:${p.id}`}>{p.name}</option>)}</optgroup>}
        {services.length > 0 && <optgroup label={t("lpContactInterestedServices")}>{services.map((s) => <option key={s.id} value={`service:${s.id}`}>{s.name}</option>)}</optgroup>}
      </select>
    </label>
  );
}
