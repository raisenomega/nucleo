import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { FileText } from "lucide-react";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { usePdf } from "@shared/hooks/usePdf";
import { useAccountsReceivable } from "@finance/application/useAccountsReceivable.hook";
import { supabaseArRepository } from "@finance/infrastructure/supabase-ar.repository";
import { AccountsReceivableTable } from "@finance/presentation/AccountsReceivableTable";
import { AccountsReceivableCollectForm } from "@finance/presentation/AccountsReceivableCollectForm";
import { NotaGestionForm } from "@finance/presentation/NotaGestionForm";
import type { AccountReceivable } from "@finance/domain/accounts-receivable.types";

export const Route = createFileRoute("/_authenticated/accounts-receivable")({ component: ARPage });

function ARPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const m = useAccountsReceivable(supabaseArRepository);
  const [collecting, setCollecting] = useState<AccountReceivable | null>(null);
  const [noting, setNoting] = useState<AccountReceivable | null>(null);
  const pdf = usePdf();
  const exportPdf = () => { const rows = m.snapshot?.items ?? []; void pdf.generatePdf("report", null, {
    title: t("accountsReceivable"), date_from: "", date_to: "",
    kpis: [{ label: t("totalPending"), value: `$${(m.snapshot?.totalPending ?? 0).toFixed(2)}` }, { label: t("pendingDebts"), value: String(m.snapshot?.count ?? 0) }],
    tables: [{ title: t("pendingDebts"), headers: [t("contactName"), t("phone"), t("amount"), t("date"), t("employee")],
      rows: rows.map((r) => [r.clientName, r.phone ?? "—", `$${r.amount.toFixed(2)}`, r.routeDate, r.assignedTo]) }], charts: [],
  }); };
  if (!can("accounts_receivable", "view")) return <Navigate to="/dashboard" />;
  const canAct = can("accounts_receivable", "edit") || can("routes", "edit");
  const forgive = (r: AccountReceivable) => {
    const reason = window.prompt(t("forgiveReason"));
    if (reason != null) void m.forgive(r.stopId, reason).then((res) => { if (!res.ok) window.alert(res.error); });
  };
  const collect = (methodId: string) => {
    if (collecting) void m.collect(collecting.stopId, methodId).then((res) => { if (!res.ok) window.alert(res.error); });
    setCollecting(null);
  };
  const saveNote = (text: string) => {
    if (noting) void m.addNote(noting.stopId, text).then((res) => { window.alert(res.ok ? t("noteSaved") : res.error); });
    setNoting(null);
  };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("accountsReceivable")}</h1>
          <button type="button" disabled={pdf.generating || !m.snapshot?.count} onClick={exportPdf}
            className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-bold disabled:opacity-50"><FileText className="h-4 w-4" /> {pdf.generating ? t("generatingPdf") : t("debtsReport")}</button>
        </div>
        <p className="text-xs text-muted-foreground">{t("pendingDebts")}</p>
      </div>
      {m.snapshot && (
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("totalPending")}</span>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(m.snapshot.totalPending)}
            <span className="ml-2 text-sm font-normal text-muted-foreground">({m.snapshot.count})</span></p>
        </div>
      )}
      <AccountsReceivableTable rows={m.snapshot?.items ?? []} onCollect={canAct ? setCollecting : undefined}
        onForgive={canAct ? forgive : undefined} onNote={canAct ? setNoting : undefined} />
      {collecting && <AccountsReceivableCollectForm item={collecting} onClose={() => setCollecting(null)} onSubmit={collect} />}
      {noting && <NotaGestionForm clientName={noting.clientName} onClose={() => setNoting(null)} onSubmit={saveNote} />}
    </div>
  );
}
