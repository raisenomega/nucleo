import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { InvoicesTab } from "@billing/presentation/InvoicesTab";
import { PlansTab } from "@billing/presentation/PlansTab";

export const Route = createFileRoute("/_authenticated/billing")({ component: BillingPage });

type Tab = "invoices" | "plans" | "orders";

function BillingPage() {
  const { t } = useI18n(); const { can } = useModuleAccess();
  const [tab, setTab] = useState<Tab>("invoices");
  if (!can("billing", "view")) return <Navigate to="/dashboard" />;
  const tabs: { k: Tab; label: string }[] = [
    { k: "invoices", label: t("invoice") }, { k: "plans", label: t("recurringPlans") }, { k: "orders", label: t("orders") }];
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="font-display text-xl font-bold text-primary md:text-3xl">{t("billing")}</h1>
        <p className="text-xs text-muted-foreground">{t("billingSubtitle")}</p>
      </div>
      <div className="flex flex-wrap gap-2">{tabs.map((x) => (
        <button key={x.k} type="button" onClick={() => setTab(x.k)}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${tab === x.k ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{x.label}</button>))}</div>
      {tab === "invoices" && <InvoicesTab />}
      {tab === "plans" && <PlansTab />}
      {tab === "orders" && <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>}
    </div>
  );
}
