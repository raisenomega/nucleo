import { AlertTriangle } from "lucide-react";
import { useI18n } from "@shared/i18n";

export function AwaitingConfirmationBanner({ clientConfirmedAt }: { clientConfirmedAt: string | null }) {
  const { t } = useI18n();
  const when = clientConfirmedAt ? new Date(clientConfirmedAt).toLocaleString() : "";
  return (
    <div className="flex items-start gap-3 rounded-lg border border-yellow-400/50 bg-yellow-100 p-4 text-sm text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <p>{t("ordAwaitingBanner")}{when && ` (${when})`}</p>
    </div>
  );
}
