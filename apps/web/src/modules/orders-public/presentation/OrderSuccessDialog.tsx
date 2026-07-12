import { Check } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { OrderSuccessAthMovilFlow } from "@orders-public/presentation/OrderSuccessAthMovilFlow";
import { CopyOrderDetailsButton } from "@orders-public/presentation/CopyOrderDetailsButton";
import type { PaymentOption } from "@orders-public/domain/order-form.types";

export function OrderSuccessDialog({ orderNumber, orderId, method, total, itemName, onClose }: {
  orderNumber: string; orderId: string; method: PaymentOption | null; total: number; itemName: string; onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const instr = method ? (locale === "en" ? method.instructionsEn : method.instructionsEs) : "";
  const copyText = `${t("opTitle")} ${orderNumber} — ${itemName} — $${total.toFixed(2)}`;
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success"><Check className="h-8 w-8" /></div>
        <h2 className="font-display text-lg font-bold text-foreground">{t("opSuccess")}</h2>
        <p className="font-mono text-sm font-bold text-foreground">{orderNumber}</p>
        {instr && <p className="rounded-lg border border-border bg-secondary/50 p-3 text-left text-sm text-foreground">{instr}</p>}
        {method?.methodKey === "ath_movil_manual"
          ? <OrderSuccessAthMovilFlow orderId={orderId} />
          : <button type="button" onClick={onClose} className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground">{t("opUnderstood")}</button>}
        <CopyOrderDetailsButton text={copyText} />
        <button type="button" onClick={onClose} className="text-sm text-muted-foreground underline">{t("opClose")}</button>
      </div>
    </ScreenModal>
  );
}
