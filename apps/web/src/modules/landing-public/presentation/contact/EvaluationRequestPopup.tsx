import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { isReady } from "@shared/types/fetch-state.types";
import { ScreenModal } from "@shared/components/ScreenModal";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";
import { ContactSuccess } from "@landing-public/presentation/contact/ContactSuccess";
import { useLandingCatalogItems } from "@landing-public/presentation/useLandingCatalogItems.hook";
import { useEvaluationLead } from "@landing-public/presentation/contact/useEvaluationLead.hook";
import { evalSchema } from "@landing-public/presentation/contact/eval-form.schema";

const VMSG: Record<string, TranslationKey> = { name: "lpContactValidationName", email: "lpContactValidationEmail", phone: "lpVisitValPhone", address: "lpVisitValAddress", preferredDate: "lpVisitValAddress", quantity: "lpEvalValQty" };
const FIELDS = [["name", "lpContactFieldName", "text"], ["email", "lpContactFieldEmail", "text"], ["phone", "lpContactFieldPhone", "tel"], ["address", "lpVisitFieldAddress", "text"], ["preferredDate", "lpVisitFieldDate", "date"]] as const;
const fld = "mt-1 w-full rounded-lg border border-[color:var(--glass-border)] bg-transparent p-3 text-sm disabled:opacity-50";

// Popup "Coordinar una visita" = solicitud de Evaluación ($80). Reusa _public_create_lead (service_request).
export function EvaluationRequestPopup({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const catalog = useLandingCatalogItems();
  const evalId = (isReady(catalog) ? catalog.data.services : []).find((s) => s.slug === "evaluacion")?.id;
  const lead = useEvaluationLead();
  const [f, setF] = useState({ name: "", email: "", phone: "", address: "", preferredDate: "", propertyType: "residential", quantity: "1", notes: "" });
  const [errs, setErrs] = useState<Record<string, TranslationKey>>({});
  const busy = lead.status === "submitting";
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  function go(e: React.FormEvent) {
    e.preventDefault();
    const r = evalSchema.safeParse(f);
    if (!r.success) { const m: Record<string, TranslationKey> = {}; for (const i of r.error.issues) { const k = String(i.path[0]); if (VMSG[k]) m[k] = VMSG[k]!; } return void setErrs(m); }
    const v = r.data;
    const prop = t(v.propertyType === "commercial" ? "lpEvalPropComm" : "lpEvalPropRes");
    const msg = `${t("lpEvalLeadHeader")}\n${t("lpEvalPropertyType")}: ${prop}\n${t("lpEvalQuantity")}: ${v.quantity}\n${t("lpVisitFieldAddress")}: ${v.address}\n${t("lpVisitFieldDate")}: ${v.preferredDate}\n\n${v.notes || ""}`.trim();
    setErrs({});
    void lead.submit({ name: v.name, email: v.email, phone: v.phone, message: msg, serviceId: evalId, preferredDate: v.preferredDate });
  }
  return (
    <ScreenModal onClose={onClose}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/85 p-4 backdrop-blur">
        <h2 className="font-display text-lg font-bold text-foreground">{t("lpVisitCardTitle")}</h2>
        <button type="button" onClick={onClose} aria-label={t("opClose")}><X className="h-6 w-6" /></button>
      </div>
      <div className="p-4">
        {lead.status === "success" ? <ContactSuccess message={lead.confirmationMessage} onReset={onClose} /> : (
          <form onSubmit={go} className="space-y-3">
            <p className="rounded-lg bg-primary/10 p-3 text-sm font-semibold text-primary">{t("lpEvalPrice")}</p>
            {lead.status === "error" && <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{t("lpContactErrorNetwork")}</div>}
            {FIELDS.map(([k, lbl, type]) => (
              <label key={k} className="block text-sm font-medium">{t(lbl)}
                <input type={type} value={f[k]} disabled={busy} onChange={(e) => set(k, e.target.value)} className={fld} />
                {errs[k] && <span className="text-xs text-destructive">{t(errs[k]!)}</span>}</label>))}
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium">{t("lpEvalPropertyType")}
                <select value={f.propertyType} disabled={busy} onChange={(e) => set("propertyType", e.target.value)} className={fld}>
                  <option value="residential">{t("lpEvalPropRes")}</option><option value="commercial">{t("lpEvalPropComm")}</option></select></label>
              <label className="block text-sm font-medium">{t("lpEvalQuantity")}
                <input type="number" min={1} value={f.quantity} disabled={busy} onChange={(e) => set("quantity", e.target.value)} className={fld} />
                {errs.quantity && <span className="text-xs text-destructive">{t(errs.quantity)}</span>}</label>
            </div>
            <label className="block text-sm font-medium">{t("lpContactFieldMessage")}
              <textarea value={f.notes} disabled={busy} onChange={(e) => set("notes", e.target.value)} rows={2} className={fld} /></label>
            <FloatingButton type="submit" variant="primary" size="lg" disabled={busy}>{t(busy ? "lpContactSubmitting" : "lpVisitSubmit")}</FloatingButton>
          </form>)}
      </div>
    </ScreenModal>
  );
}
