import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { MonthClosurePanel } from "@finance/presentation/MonthClosurePanel";
import { FiscalYearClose } from "@accounting/presentation/FiscalYearClose";
import { OpeningEntryModal } from "@accounting/presentation/OpeningEntryModal";
import { useChartOfAccounts } from "@accounting/application/useChartOfAccounts.hook";
import { supabaseChartOfAccountsRepository } from "@accounting/infrastructure/supabase-chart-of-accounts.repository";
import { accountingActionsRepository as repo } from "@accounting/infrastructure/supabase-accounting-actions.repository";

// Cierre contable (Opción B): cierre mensual (panel de Conciliación reusado) + cierre fiscal anual + asiento de apertura.
export function PeriodClosePage() {
  const { t } = useI18n();
  const { session } = useSession();
  const isCeo = session?.role === "ceo" || session?.role === "superadmin";
  const coa = useChartOfAccounts(supabaseChartOfAccountsRepository);
  const [opening, setOpening] = useState(false);
  const [hasOpening, setHasOpening] = useState(true);
  useEffect(() => { void repo.hasOpening().then(setHasOpening); }, []);
  return (
    <div className="space-y-4 p-4 md:p-8">
      <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("periodClose")}</h1>
      <MonthClosurePanel />
      {isCeo && <FiscalYearClose />}
      {isCeo && !hasOpening && (
        <button type="button" onClick={() => setOpening(true)} className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold text-foreground">
          <BookOpen className="h-4 w-4" />{t("createOpeningEntry")}
        </button>
      )}
      {opening && <OpeningEntryModal accounts={coa.accounts} onSaved={() => setHasOpening(true)} onClose={() => setOpening(false)} />}
    </div>
  );
}
