import { useI18n } from "@shared/i18n";

// Chip que marca un ítem de membresía recurrente. Decisión Rodaja C: solo se muestra en recurrentes (is_recurring);
// los de pago único NO llevan badge (evita ruido — la ausencia = pago único). Estilo glass/accent tenant-aware.
export function BillingBadge({ isRecurring }: { isRecurring?: boolean }) {
  const { t } = useI18n();
  if (!isRecurring) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-[color:hsl(var(--tenant-accent-hsl))] px-2 py-0.5 text-xs font-bold text-[color:hsl(var(--tenant-accent-hsl))]">
      {t("billingRecurring")}
    </span>
  );
}
