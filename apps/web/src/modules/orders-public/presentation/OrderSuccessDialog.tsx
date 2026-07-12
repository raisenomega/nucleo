import { Check } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";

export function OrderSuccessDialog({ orderNumber, onClose }: { orderNumber: string; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-3 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="font-display text-lg font-bold text-foreground">{t("opSuccess")}</h2>
        <p className="text-sm text-muted-foreground">{t("opSuccessMsg")}</p>
        <p className="font-mono text-sm font-bold text-foreground">{orderNumber}</p>
        <button type="button" onClick={onClose} className="w-full rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground">{t("opClose")}</button>
      </div>
    </ScreenModal>
  );
}
