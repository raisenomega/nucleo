import { useI18n } from "@shared/i18n";
import type { PaymentOption } from "@orders-public/domain/order-form.types";

export function PaymentMethodPicker({ methods, value, onChange }: {
  methods: PaymentOption[]; value: string; onChange: (v: string) => void;
}) {
  const { t, locale } = useI18n();
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-foreground">{t("opPayment")}</span>
      <div className="space-y-1">
        {methods.map((m) => (
          <label key={m.methodKey} className="flex items-center gap-2 rounded-lg border border-border p-2 text-sm text-foreground">
            <input type="radio" checked={value === m.methodKey} onChange={() => onChange(m.methodKey)} />
            {locale === "en" ? m.nameEn : m.nameEs}
          </label>
        ))}
      </div>
    </div>
  );
}
