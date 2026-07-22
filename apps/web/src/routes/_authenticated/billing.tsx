import { useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { InvoicesTab } from "@billing/presentation/InvoicesTab";
import { PlansTab } from "@billing/presentation/PlansTab";
import { ArAgingPanel } from "@shared/customers/ArAgingPanel";

export const Route = createFileRoute("/_authenticated/billing")({ component: BillingPage });

type Tab = "invoices" | "receivables" | "plans" | "orders";

function BillingPage() {
  const { t } = useI18n(); const { can } = useModuleAccess();
  const [tab, setTab] = useState<Tab>("invoices");
  if (!can("billing", "view")) return <Navigate to="/dashboard" />;
  const tabs: { k: Tab; label: string }[] = [
    { k: "invoices", label: t("invoice") }, { k: "receivables", label: "Cartera" }, { k: "plans", label: t("recurringPlans") }, { k: "orders", label: t("orders") }];
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("billing")}</h1>
        <p className="text-xs text-muted-foreground">{t("billingSubtitle")}</p>
      </div>
      <div className="flex flex-wrap gap-2">{tabs.map((x) => (
        <button key={x.k} type="button" onClick={() => setTab(x.k)}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${tab === x.k ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{x.label}</button>))}</div>
      {tab === "invoices" && <InvoicesTab />}
      {tab === "receivables" && <ArAgingPanel />}
      {tab === "plans" && <PlansTab />}
      {tab === "orders" && (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-bold text-foreground">{t("ordersSetupTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("ordersSetupHint")}</p>
        </div>)}
    </div>
  );
}
