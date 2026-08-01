import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useSession } from "@shared/providers/SessionProvider";
import { ManualEntryModal } from "@accounting/presentation/ManualEntryModal";
import { useChartOfAccounts } from "@accounting/application/useChartOfAccounts.hook";
import { supabaseChartOfAccountsRepository } from "@accounting/infrastructure/supabase-chart-of-accounts.repository";
import { useJournalEntries } from "@accounting/application/useJournalEntries.hook";
import { journalRepository } from "@accounting/infrastructure/supabase-journal-entry.repository";
import { JournalFilters } from "@accounting/presentation/JournalFilters";
import { JournalEntriesTable } from "@accounting/presentation/JournalEntriesTable";
import { TrialBalanceView } from "@accounting/presentation/TrialBalanceView";
import type { JournalFilters as JF } from "@accounting/domain/journal-entry.types";

export function JournalEntriesPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { session } = useSession();
  const isCeo = session?.role === "ceo" || session?.role === "superadmin";
  const cost = can("accounting", "cost");
  const coa = useChartOfAccounts(supabaseChartOfAccountsRepository);
  const [view, setView] = useState<"entries" | "trial">("entries");
  const [manual, setManual] = useState(false);
  const [filters, setFilters] = useState<JF>(() => { const d = new Date();
    return { periodYear: d.getFullYear(), periodMonth: d.getMonth() + 1, accountId: null, sourceType: null, status: null, search: "" }; });
  const j = useJournalEntries(journalRepository, filters, view);
  const upd = (f: Partial<JF>) => setFilters((s) => ({ ...s, ...f }));
  const tab = (v: "entries" | "trial", label: string) => (
    <button type="button" onClick={() => setView(v)} className={`px-3 py-1.5 text-sm font-bold ${view === v ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}>{label}</button>
  );
  return (
    <div className="space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("generalLedger")}</h1>
        {isCeo && <button type="button" onClick={() => setManual(true)} className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" />{t("newEntry")}</button>}
      </div>
      <div className="flex gap-2 border-b border-border">{tab("entries", t("entriesTab"))}{tab("trial", t("trialBalance"))}</div>
      <JournalFilters filters={filters} accounts={coa.accounts} view={view} onChange={upd} />
      {j.loading ? <p className="text-sm text-muted-foreground">…</p>
        : view === "entries" ? <JournalEntriesTable entries={j.entries} cost={cost} canEdit={isCeo} onChanged={() => void j.reload()} />
        : j.error ? <p className="text-sm text-destructive">{j.error}</p>
        : <TrialBalanceView rows={j.trial} />}
      {manual && <ManualEntryModal accounts={coa.accounts} onSaved={() => void j.reload()} onClose={() => setManual(false)} />}
    </div>
  );
}
