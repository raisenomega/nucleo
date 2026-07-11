import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";

export function ContactSuccess({ message, onReset }: { message?: string; onReset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="py-6 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
      <h3 className="mt-4 text-xl font-bold">{t("lpContactSuccessTitle")}</h3>
      <p className="mt-2 text-[color:hsl(var(--lp-muted))]">{message || t("lpContactSuccessDefault")}</p>
      <FloatingButton variant="ghost" onClick={onReset} className="mt-6">{t("lpContactSuccessReset")}</FloatingButton>
    </div>
  );
}
