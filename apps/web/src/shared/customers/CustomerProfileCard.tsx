import { useState } from "react";
import { MessageCircle, Mail } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { setCustomerActive, saveCustomerNote } from "@shared/customers/customer-crm.repository";
import type { AdminCustomer } from "@shared/customers/customers-agg";

const wa = (p: string) => `https://wa.me/${p.replace(/\D/g, "")}`;

// Sección Perfil + acciones del CEO (WhatsApp/email/activar-desactivar/nota interna).
export function CustomerProfileCard({ c, onChanged }: { c: AdminCustomer; onChanged: () => void }) {
  const { t } = useI18n();
  const [note, setNote] = useState(c.notesForTeam);
  const addr = [c.address, c.city, c.state, c.zipCode].filter(Boolean).join(", ");
  const row = (l: string, v: string) => (v ? <div><dt className="inline text-muted-foreground">{l}: </dt><dd className="inline">{v}</dd></div> : null);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">{c.photoUrl && <img src={c.photoUrl} className="h-12 w-12 rounded-full object-cover" alt="" />}<div><p className="font-bold text-foreground">{c.fullName || "—"}</p><p className="text-xs text-muted-foreground">{c.email}</p></div></div>
      <dl className="space-y-1 text-sm">{row(t("pPhone"), c.phone)}{row(t("pAddress"), addr)}{row(t("pContactPref"), c.contactPreference)}{row(t("cRegisteredOn"), c.createdAt.slice(0, 10))}</dl>
      <div className="flex flex-wrap gap-2">
        {c.phone && <a href={wa(c.phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-bold text-white"><MessageCircle className="h-4 w-4" />WhatsApp</a>}
        <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-sm font-bold"><Mail className="h-4 w-4" />Email</a>
        <button type="button" onClick={() => void setCustomerActive(c.id, !c.isActive).then(onChanged)} className="rounded-lg bg-secondary px-3 py-1.5 text-sm">{c.isActive ? t("cDeactivate") : t("cActivate")}</button>
      </div>
      <div className="space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("cInternalNote")}</span>
        <div className="flex gap-2"><input value={note} onChange={(e) => setNote(e.target.value)} className="flex-1 rounded-lg border border-border bg-background p-2 text-sm" /><button type="button" onClick={() => void saveCustomerNote(c.id, note).then(onChanged)} className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-bold">{t("save")}</button></div>
      </div>
    </div>
  );
}
