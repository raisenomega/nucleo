import { useI18n } from "@shared/i18n";
import type { OrderFormField } from "@orders-public/domain/order-form.types";

// Pseudo-field kind='disclaimer': texto informativo entre secciones, sin input ni value. style: info|warning|neutral.
const STYLE: Record<string, string> = {
  info: "border-primary/30 bg-primary/5 text-foreground",
  warning: "border-destructive/40 bg-destructive/10 text-destructive",
  neutral: "border-border bg-muted/40 text-muted-foreground",
};
export function DisclaimerField({ field }: { field: OrderFormField }) {
  const { locale } = useI18n();
  const text = locale === "en" ? field.labelEn : field.labelEs;
  const style = STYLE[(field.validation.style as string) ?? "info"] ?? STYLE.info;
  return <p className={`rounded-lg border p-3 text-xs leading-relaxed ${style}`}>{text}</p>;
}
