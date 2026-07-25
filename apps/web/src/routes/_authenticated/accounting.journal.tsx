import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";

// Placeholder — el visor del libro mayor se implementa en C6.
export const Route = createFileRoute("/_authenticated/accounting/journal")({ component: JournalPage });

function JournalPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("generalLedger")}</h1>
      <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}
