import { useI18n } from "@shared/i18n";

// Input opcional del texto del botón (CTA) por-ítem. Vacío → null → el frontend usa el default por tipo.
// El placeholder muestra el default que aplicaría (lo pasa cada modal según su tipo).
export function CtaLabelInput({ value, onChange, placeholder }: {
  value: string | null; onChange: (v: string | null) => void; placeholder: string;
}) {
  const { t } = useI18n();
  return (
    <label className="block space-y-1">
      <span className="text-sm font-bold text-foreground">{t("ctaLabelField")}</span>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground" />
      <span className="block text-xs text-muted-foreground">{t("ctaLabelHelp")}</span>
    </label>
  );
}
