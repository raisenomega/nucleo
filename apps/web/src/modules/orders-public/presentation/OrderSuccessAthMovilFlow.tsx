import { useI18n } from "@shared/i18n";
import { useConfirmAthMovilSent } from "@orders-public/presentation/useConfirmAthMovilSent.hook";

export function OrderSuccessAthMovilFlow({ orderId }: { orderId: string }) {
  const { t } = useI18n();
  const { busy, done, confirm } = useConfirmAthMovilSent();
  if (done) return <p className="rounded-lg bg-success/15 p-3 text-sm text-success">{t("opAthThanks")}</p>;
  return (
    <button type="button" disabled={busy} onClick={() => void confirm(orderId)}
      className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50">
      {busy ? t("opSubmitting") : t("opAthSent")}
    </button>
  );
}
