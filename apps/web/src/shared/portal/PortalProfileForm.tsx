import { useState } from "react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { updateMyCustomer } from "@shared/portal/customer.repository";
import type { CustomerProfile, CustomerFormData } from "@shared/portal/customer.types";

type StrKey = "fullName" | "phone" | "address" | "city" | "state" | "zipCode" | "notesForTeam";

// Mi Perfil (CRUD) — datos del cliente, se reutilizan al solicitar servicio. Email read-only (es el login).
export function PortalProfileForm({ profile, onSaved }: { profile: CustomerProfile; onSaved: () => void }) {
  const { t } = useI18n();
  const [f, setF] = useState<CustomerFormData>({ ...profile });
  const [msg, setMsg] = useState<"" | "ok" | "err">(""); const [busy, setBusy] = useState(false);
  const set = (p: Partial<CustomerFormData>) => { setF((c) => ({ ...c, ...p })); setMsg(""); };
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm"; const lbl = "text-xs font-bold text-muted-foreground";
  const save = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); const ok = await updateMyCustomer(profile.id, f); setBusy(false); setMsg(ok ? "ok" : "err"); if (ok) onSaved(); };
  const txt = (k: StrKey, key: TranslationKey) => (<label className="space-y-1"><span className={lbl}>{t(key)}</span><input value={f[k]} onChange={(e) => set({ [k]: e.target.value } as Partial<CustomerFormData>)} className={fld} /></label>);
  return (
    <form onSubmit={save} className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-2">
      <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("email")}</span><input value={profile.email} readOnly className={`${fld} opacity-70`} /></label>
      {txt("fullName", "pFullName")}{txt("phone", "pPhone")}
      {txt("address", "pAddress")}{txt("city", "pCity")}{txt("state", "pState")}{txt("zipCode", "pZip")}
      <label className="space-y-1"><span className={lbl}>{t("pContactPref")}</span><select value={f.contactPreference} onChange={(e) => set({ contactPreference: e.target.value })} className={fld}><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="phone">{t("pPhone")}</option></select></label>
      <label className="space-y-1"><span className={lbl}>{t("pLanguage")}</span><select value={f.language} onChange={(e) => set({ language: e.target.value })} className={fld}><option value="es">Español</option><option value="en">English</option></select></label>
      <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("pNotesTeam")}</span><input value={f.notesForTeam} onChange={(e) => set({ notesForTeam: e.target.value })} className={fld} placeholder={t("pNotesHint")} /></label>
      {msg === "ok" && <p className="text-sm text-green-600 md:col-span-2">{t("pProfileSaved")}</p>}
      {msg === "err" && <p className="text-sm text-destructive md:col-span-2">{t("pSaveError")}</p>}
      <div className="md:col-span-2"><button type="submit" disabled={busy} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold disabled:opacity-50">{t("save")}</button></div>
    </form>
  );
}
