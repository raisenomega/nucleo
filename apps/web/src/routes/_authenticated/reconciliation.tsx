import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { useReconciliation } from "@finance/application/useReconciliation.hook";
import { supabaseReconciliationRepository } from "@finance/infrastructure/supabase-reconciliation.repository";
import { supabaseBankAccountRepository } from "@finance/infrastructure/supabase-bank-account.repository";
import { ReconciliationBankPanel } from "@finance/presentation/ReconciliationBankPanel";
import { ReconciliationTaxPanel } from "@finance/presentation/ReconciliationTaxPanel";
import { ReconciliationRetentionPanel } from "@finance/presentation/ReconciliationRetentionPanel";
import { ReconciliationSummary } from "@finance/presentation/ReconciliationSummary";
import { BankAccountForm } from "@finance/presentation/BankAccountForm";
import { RetentionDepositForm } from "@finance/presentation/RetentionDepositForm";

export const Route = createFileRoute("/_authenticated/reconciliation")({ component: ReconciliationPage });

function ReconciliationPage() {
  const { t } = useI18n();
  const { canEdit } = useRoleGate();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [modal, setModal] = useState<"bank" | "deposit" | null>(null);
  const m = useReconciliation(supabaseReconciliationRepository, supabaseBankAccountRepository, month);

  if (!canEdit("coo")) return <div className="p-8 text-sm text-muted-foreground">{t("notAuthorized")}</div>;

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t("reconciliation")}</h1>
          <p className="text-xs text-muted-foreground">{t("reconciliationSubtitle")}</p>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm" />
      </div>
      {m.loading || !m.snapshot ? <p className="text-sm text-muted-foreground">{t("noData")}</p> : (
        <div className="space-y-6">
          <ReconciliationBankPanel bank={m.snapshot.bank} accounts={m.bankAccounts} onAdd={() => setModal("bank")}
            onRemove={(id) => { if (window.confirm(`${t("delete")}?`)) void m.removeAccount(id); }} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ReconciliationTaxPanel tax={m.snapshot.tax} />
            <ReconciliationSummary summary={m.snapshot.summary} />
          </div>
          <ReconciliationRetentionPanel retention={m.snapshot.retention} deposits={m.deposits} onRegister={() => setModal("deposit")} />
        </div>
      )}
      {modal === "bank" && <BankAccountForm onCancel={() => setModal(null)} onSubmit={(d) => { void m.addAccount(d); setModal(null); }} />}
      {modal === "deposit" && <RetentionDepositForm onCancel={() => setModal(null)} onSubmit={(d) => { void m.addDeposit(d); setModal(null); }} />}
    </div>
  );
}
