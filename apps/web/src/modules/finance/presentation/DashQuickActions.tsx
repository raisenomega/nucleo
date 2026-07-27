import { Link } from "@tanstack/react-router";
import { Wallet, FileText, DollarSign, Bell } from "lucide-react";
import { useI18n } from "@shared/i18n";

// Acciones rápidas: crear gasto/factura/ingreso + ver alertas (con badge de conteo).
export function DashQuickActions({ alerts }: { alerts: number }) {
  const { t } = useI18n();
  const btn = "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-bold text-foreground hover:border-primary";
  return (
    <div className="flex flex-wrap gap-2">
      <Link to="/expenses" className={btn}><Wallet className="h-4 w-4" />{t("newExpense")}</Link>
      <Link to="/billing" search={{}} className={btn}><FileText className="h-4 w-4" />{t("newInvoice")}</Link>
      <Link to="/income" className={btn}><DollarSign className="h-4 w-4" />{t("registerIncome")}</Link>
      <Link to="/notifications" className={btn}><Bell className="h-4 w-4" />{t("viewAlerts")}
        {alerts > 0 && <span className="rounded-full bg-destructive px-1.5 text-xs font-bold text-white">{alerts}</span>}</Link>
    </div>
  );
}
