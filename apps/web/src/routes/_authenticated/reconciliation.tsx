import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { usePdf } from "@shared/hooks/usePdf";
import { buildFiscalBody } from "@finance/presentation/recon-pdf";
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
  const { can } = useModuleAccess();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [modal, setModal] = useState<Modal>(null);
  const m = useReconciliation(supabaseReconciliationRepository, supabaseBankAccountRepository, month);
  const pdf = usePdf();
  const close = () => setModal(null);
  const submit = async (op: Promise<RepoResult>) => {
    try { const r = await op; if (!r.ok) { window.alert(r.error); return; } close(); }
    catch (e) { window.alert(e instanceof Error ? e.message : String(e)); }
  };

  if (!can("reconciliation", "view")) return <Navigate to="/dashboard" />;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-primary md:text-3xl">{t("reconciliation")}</h1>
          <div className="flex items-center gap-2">
            {can("reconciliation", "fiscal") && (
              <button type="button" disabled={pdf.generating || !m.snapshot} onClick={() => { if (m.snapshot) void pdf.generatePdf("report", null, buildFiscalBody(month, m.snapshot, t("fiscalReport"))); }}
                className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-bold disabled:opacity-50"><FileText className="h-4 w-4" /> {pdf.generating ? t("generatingPdf") : t("fiscalReport")}</button>)}
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-border bg-background p-2 text-sm" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("reconciliationSubtitle")}</p>
      </div>
      {m.loading || !m.snapshot ? <p className="text-sm text-muted-foreground">{t("noData")}</p> : (
        <div className="space-y-6">
          <ReconciliationBankPanel bank={m.snapshot.bank} accounts={m.bankAccounts}
            onAddAccount={can("reconciliation", "create") ? () => setModal("account") : undefined}
            onDeposit={can("reconciliation", "create") ? () => setModal("deposit") : undefined}
            onRegisterBalance={can("reconciliation", "edit") ? () => setModal("balance") : undefined}
            onRemoveAccount={can("reconciliation", "delete") ? (id) => { if (window.confirm(`${t("delete")}?`)) void m.removeAccount(id); } : undefined} />
          {can("reconciliation", "fiscal") && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ReconciliationTaxPanel tax={m.snapshot.tax} />
              <ReconciliationSummary summary={m.snapshot.summary} />
            </div>
          )}
          {can("reconciliation", "fiscal") && <ReconciliationHealth health={m.snapshot.summary.health} />}
          {can("reconciliation", "fiscal") && <ReconciliationRetentionPanel retention={m.snapshot.retention} />}
        </div>
      )}
      {modal === "account" && <BankAccountForm onCancel={close} onSubmit={(d) => void submit(m.addAccount(d))} />}
      {modal === "deposit" && <BankDepositForm accounts={m.bankAccounts} onCancel={close} onSubmit={(d) => void submit(m.addBankDeposit(d))} />}
      {modal === "balance" && <BankBalanceForm accounts={m.bankAccounts} onCancel={close} onSubmit={(d) => void submit(m.upsertBankBalance(d))} />}
    </div>
  );
}
