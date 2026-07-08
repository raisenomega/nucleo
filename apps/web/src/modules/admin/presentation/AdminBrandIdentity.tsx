import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import type { TenantIdentity } from "@admin/domain/brand.types";
import type { RepoResult } from "@admin/domain/admin.types";

// Sección 1 — identidad de la empresa: logo + nombres + datos de contacto (van a settings/tenants).
export function AdminBrandIdentity({ identity, logoUrl, get, onUploadLogo, onSave }: {
  identity: TenantIdentity | null; logoUrl: string | null; get: (k: string) => string;
  onUploadLogo: (file: File) => Promise<void>;
  onSave: (legal: string, display: string, fields: Record<string, string>) => Promise<RepoResult>;
}) {
  const { t } = useI18n();
  const [legal, setLegal] = useState(""); const [display, setDisplay] = useState("");
  const [address, setAddress] = useState(""); const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(""); const [website, setWebsite] = useState("");
  const [taxId, setTaxId] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    setLegal(identity?.legalName ?? ""); setDisplay(identity?.displayName ?? "");
    setAddress(get("company_address")); setPhone(get("company_phone")); setEmail(get("company_email"));
    setWebsite(get("company_website")); setTaxId(get("company_tax_id"));
  }, [identity]); // eslint-disable-line react-hooks/exhaustive-deps
  async function save() {
    if (!legal.trim()) return; setBusy(true);
    const r = await onSave(legal, display, { company_address: address, company_phone: phone, company_email: email, company_website: website, company_tax_id: taxId });
    setBusy(false); window.alert(r.ok ? t("noteSaved") : r.error);
  }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <h3 className="font-body font-bold text-primary">{t("identitySection")}</h3>
      <div className="flex items-center gap-4">
        {logoUrl ? <img src={logoUrl} alt="logo" className="h-16 w-16 rounded-lg border border-border object-contain" />
          : <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">{t("logoLbl")}</div>}
        <label className="space-y-1"><span className={lbl}>{t("logoLbl")}</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" className={fld}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUploadLogo(f); }} /></label>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="space-y-1"><span className={lbl}>{t("legalNameLbl")}</span>
          <input required value={legal} onChange={(e) => setLegal(e.target.value)} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("tradeName")}</span>
          <input value={display} onChange={(e) => setDisplay(e.target.value)} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("phone")}</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("email")}</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("website")}</span>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} className={fld} /></label>
        <label className="space-y-1"><span className={lbl}>{t("taxId")}</span>
          <input value={taxId} onChange={(e) => setTaxId(e.target.value)} className={fld} /></label>
      </div>
      <label className="block space-y-1"><span className={lbl}>{t("address")}</span>
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={fld} /></label>
      <button type="button" disabled={busy} onClick={() => void save()}
        className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("save")}</button>
    </div>
  );
}
