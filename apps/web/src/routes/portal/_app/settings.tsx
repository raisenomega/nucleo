import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { usePortal } from "@shared/portal/portal-context";
import { PortalPasswordForm } from "@shared/portal/PortalPasswordForm";
import { PortalThemeToggle } from "@shared/portal/PortalThemeToggle";
import { updateCustomerPrefs, deactivateAccount, exportMyData } from "@shared/portal/settings.repository";
import { signOutCustomer } from "@shared/portal/portal-auth";

export const Route = createFileRoute("/portal/_app/settings")({ component: PortalSettings });
const NOTIF: Record<string, TranslationKey> = { email: "pNotifEmail", push: "pNotifPush", both: "pNotifBoth", none: "pNotifNone" };

function PortalSettings() {
  const { t, setLocale } = useI18n();
  const { customer, refresh } = usePortal();
  const savePref = (patch: Record<string, string>) => void updateCustomerPrefs(customer.id, patch).then(() => refresh());
  const setLang = (lang: string) => { savePref({ language: lang }); setLocale(lang as "es" | "en"); };
  const doExport = async () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(await exportMyData(customer.tenantId), null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "mis-datos.json"; a.click(); URL.revokeObjectURL(url);
  };
  const doDelete = async () => { if (window.confirm(t("pDeleteQ"))) { await deactivateAccount(customer.id); await signOutCustomer(); window.location.assign("/portal/login"); } };
  const sec = (title: string, body: ReactNode) => <div className="space-y-2 rounded-lg border border-border bg-card p-4"><p className="text-sm font-bold uppercase text-muted-foreground">{title}</p>{body}</div>;
  const sel = "rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground">{t("navSettings")}</h1>
      {sec(t("pChangePassword"), <PortalPasswordForm />)}
      {sec(t("pLanguage"), <select value={customer.language} onChange={(e) => setLang(e.target.value)} className={sel}><option value="es">Español</option><option value="en">English</option></select>)}
      {sec(t("pNotifPref"), <select value={customer.notificationPref} onChange={(e) => savePref({ notification_pref: e.target.value })} className={sel}>{Object.keys(NOTIF).map((k) => <option key={k} value={k}>{t(NOTIF[k]!)}</option>)}</select>)}
      {sec(t("pTheme"), <PortalThemeToggle />)}
      {sec(t("pMyData"), <button type="button" onClick={() => void doExport()} className="rounded-lg bg-secondary text-foreground px-4 py-2 text-sm font-bold">{t("pExportData")}</button>)}
      {sec(t("pDangerZone"), <button type="button" onClick={() => void doDelete()} className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-white">{t("pDeleteAccount")}</button>)}
    </div>
  );
}
