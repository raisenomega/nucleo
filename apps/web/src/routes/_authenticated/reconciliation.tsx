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
import { ReconciliationHealth } from "@finance/presentation/ReconciliationHealth";
import { BankAccountForm } from "@finance/presentation/BankAccountForm";
import { BankDepositForm } from "@finance/presentation/BankDepositForm";
import { BankBalanceForm } from "@finance/presentation/BankBalanceForm";
import type { RepoResult } from "@finance/domain/bank-account.types";

export const Route = createFileRoute("/_authenticated/reconciliation")({ component: ReconciliationPage });

type Modal = "account" | "deposit" | "balance" | null;

function ReconciliationPage() {
  const { t } = useI18n();
  const { canEdit } = useRoleGate();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [modal, setModal] = useState<Modal>(null);
  const m = useReconciliation(supabaseReconciliationRepository, supabaseBankAccountRepository, month);
  const close = () => setModal(null);
  const submit = async (op: Promise<RepoResult>) => {
    try { const r = await op; if (!r.ok) { window.alert(r.error); return; } close(); }
    catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
  };

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
          <ReconciliationBankPanel bank={m.snapshot.bank} accounts={m.bankAccounts}
            onAddAccount={() => setModal("account")} onDeposit={() => setModal("deposit")} onRegisterBalance={() => setModal("balance")}
            onRemoveAccount={(id) => { if (window.confirm(`${t("delete")}?`)) void m.removeAccount(id); }} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ReconciliationTaxPanel tax={m.snapshot.tax} />
            <ReconciliationSummary summary={m.snapshot.summary} />
          </div>
          <ReconciliationHealth health={m.snapshot.summary.health} />
          <ReconciliationRetentionPanel retention={m.snapshot.retention} />
        </div>
      )}
      {modal === "account" && <BankAccountForm onCancel={close} onSubmit={(d) => void submit(m.addAccount(d))} />}
      {modal === "deposit" && <BankDepositForm accounts={m.bankAccounts} onCancel={close} onSubmit={(d) => void submit(m.addBankDeposit(d))} />}
      {modal === "balance" && <BankBalanceForm accounts={m.bankAccounts} onCancel={close} onSubmit={(d) => void submit(m.upsertBankBalance(d))} />}
    </div>
  );
}
