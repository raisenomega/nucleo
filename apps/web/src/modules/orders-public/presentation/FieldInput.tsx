import type { ReactNode } from "react";
import { useI18n } from "@shared/i18n";
import type { FieldOption, OrderFormField } from "@orders-public/domain/order-form.types";

const wrap = (label: string, input: ReactNode) => (
  <label className="block"><span className="mb-1 block text-sm font-medium text-foreground">{label}</span>{input}</label>
);

export function FieldInput({ field, value, onChange }: { field: OrderFormField; value: unknown; onChange: (v: unknown) => void }) {
  const { t, locale } = useI18n();
  const label = (locale === "en" ? field.labelEn : field.labelEs) + (field.required ? " *" : "");
  const optLabel = (o: FieldOption) => (locale === "en" ? o.label_en : o.label_es);
  const cls = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const v = value ?? "";
  if (field.kind === "checkbox") {
    const price = field.validation.price_display as string | undefined;
    const link = field.validation.terms_link as string | undefined;
    const linkLabel = (locale === "en" ? field.validation.terms_link_label_en : field.validation.terms_link_label_es) as string | undefined;
    return (
      <label className="flex items-start gap-2 text-sm text-foreground">
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4" />
        <span className="flex-1">{label}{link && <a href={link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="ml-1 text-primary underline">{linkLabel || t("viewTermsLink")}</a>}</span>
        {price && <span className="ml-auto shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{price}</span>}
      </label>
    );
  }
  if (field.kind === "textarea") return wrap(label, <textarea value={v as string} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} />);
  if (field.kind === "select") return wrap(label,
    <select value={v as string} onChange={(e) => onChange(e.target.value)} className={cls}><option value="">—</option>{field.options.map((o) => <option key={o.value} value={o.value}>{optLabel(o)}</option>)}</select>);
  if (field.kind === "radio") return (
    <div><span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      <div className="flex flex-wrap gap-4">{field.options.map((o) => <label key={o.value} className="flex items-center gap-1 text-sm text-foreground"><input type="radio" checked={v === o.value} onChange={() => onChange(o.value)} />{optLabel(o)}</label>)}</div></div>
  );
  if (field.kind === "number") return wrap(label,
    <input type="number" value={v as number} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} className={cls} />);
  const type = field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : "text";
  return wrap(label, <input type={type} value={v as string} onChange={(e) => onChange(e.target.value)} className={cls} />);
}
