import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";
import { ContactSuccess } from "@landing-public/presentation/contact/ContactSuccess";
import { useCreateLead } from "@landing-public/presentation/useCreateLead.hook";
import { visitSchema } from "@landing-public/presentation/contact/visit-form.schema";

const VMSG: Record<string, TranslationKey> = { name: "lpContactValidationName", email: "lpContactValidationEmail", phone: "lpVisitValPhone", address: "lpVisitValAddress" };
const FIELDS = [["name", "lpContactFieldName", "text"], ["email", "lpContactFieldEmail", "text"], ["phone", "lpContactFieldPhone", "tel"], ["address", "lpVisitFieldAddress", "text"], ["preferredDate", "lpVisitFieldDate", "date"]] as const;

// Popup "Coordinar una visita": form propio (dirección + fecha) que reusa _public_create_lead (form_type='contact')
// concatenando los datos de visita en el mensaje → notes legible en el CRM. Rate-limit y confirmación del RPC.
export function VisitRequestPopup({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const lead = useCreateLead();
  const [f, setF] = useState({ name: "", email: "", phone: "", address: "", preferredDate: "", notes: "" });
  const [errs, setErrs] = useState<Record<string, TranslationKey>>({});
  const fld = "mt-1 w-full rounded-lg border border-[color:var(--glass-border)] bg-transparent p-3 text-sm disabled:opacity-50";
  const busy = lead.status === "submitting";
  function go(e: React.FormEvent) {
    e.preventDefault();
    const r = visitSchema.safeParse(f);
    if (!r.success) { const m: Record<string, TranslationKey> = {}; for (const i of r.error.issues) { const k = String(i.path[0]); if (VMSG[k]) m[k] = VMSG[k]!; } return void setErrs(m); }
    setErrs({});
    const v = r.data;
    const msg = `${t("lpVisitLeadHeader")}\n${t("lpVisitFieldAddress")}: ${v.address}\n${t("lpVisitFieldDate")}: ${v.preferredDate || "—"}\n\n${v.notes || ""}`.trim();
    void lead.submit({ name: v.name, email: v.email, phone: v.phone, message: msg }, null);
  }
  const set = (k: string, val: string) => setF((p) => ({ ...p, [k]: val }));
  return (
    <ScreenModal onClose={onClose}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/85 p-4 backdrop-blur">
        <h2 className="font-display text-lg font-bold text-foreground">{t("lpVisitCardTitle")}</h2>
        <button type="button" onClick={onClose} aria-label={t("opClose")}><X className="h-6 w-6" /></button>
      </div>
      <div className="p-4">
        {lead.status === "success"
          ? <ContactSuccess message={lead.confirmationMessage} onReset={onClose} />
          : <form onSubmit={go} className="space-y-3">
              {lead.status === "error" && <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{t("lpContactErrorNetwork")}</div>}
              {FIELDS.map(([k, lbl, type]) => (
                <label key={k} className="block text-sm font-medium">{t(lbl)}
                  <input type={type} value={f[k]} disabled={busy} onChange={(e) => set(k, e.target.value)} className={fld} />
                  {errs[k] && <span className="text-xs text-destructive">{t(errs[k]!)}</span>}
                </label>))}
              <label className="block text-sm font-medium">{t("lpContactFieldMessage")}
                <textarea value={f.notes} disabled={busy} onChange={(e) => set("notes", e.target.value)} rows={3} className={fld} /></label>
              <FloatingButton type="submit" variant="primary" size="lg" disabled={busy}>{t(busy ? "lpContactSubmitting" : "lpVisitSubmit")}</FloatingButton>
            </form>}
      </div>
    </ScreenModal>
  );
}
