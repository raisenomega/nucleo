import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import type { SettingEntry, RepoResult } from "@admin/domain/admin.types";

const COUNTRIES = ["PR", "DO", "MX", "CO"];

export function AdminSettingsTab({ settings, onSave }: {
  settings: readonly SettingEntry[]; onSave: (key: string, value: string) => Promise<RepoResult>;
}) {
  const { t } = useI18n();
  const get = (k: string) => settings.find((s) => s.key === k)?.value ?? "";
  const [ret, setRet] = useState("");
  const [prefix, setPrefix] = useState("");
  const [country, setCountry] = useState("PR");
  useEffect(() => { setRet(get("retention_pct")); setPrefix(get("order_prefix")); setCountry(get("fiscal_country") || "PR"); }, [settings]);
  const field = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  async function save() {
    await onSave("retention_pct", ret); await onSave("order_prefix", prefix); await onSave("fiscal_country", country);
  }
  return (
    <div className="max-w-md space-y-4 rounded-lg border border-border bg-card p-5">
      <label className="block space-y-1"><span className={lbl}>{t("retentionPct")}</span>
        <input type="number" value={ret} onChange={(e) => setRet(e.target.value)} className={field} /></label>
      <label className="block space-y-1"><span className={lbl}>{t("orderPrefix")}</span>
        <input value={prefix} onChange={(e) => setPrefix(e.target.value)} className={field} /></label>
      <label className="block space-y-1"><span className={lbl}>{t("fiscalCountry")}</span>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className={field}>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
      <button type="button" onClick={() => void save()} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold">{t("save")}</button>
    </div>
  );
}
