import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";
import { contactSchema, type ContactInput } from "@landing-public/presentation/contact/contact-form.schema";

const VMSG: Record<string, TranslationKey> = { name: "lpContactValidationName", email: "lpContactValidationEmail", message: "lpContactValidationMessage" };
const EMSG: Record<string, TranslationKey> = { rate_limited: "lpContactErrorRateLimit", invalid_payload: "lpContactErrorInvalid", origin_not_allowed: "lpContactErrorOrigin" };
const FIELDS = [["name", "lpContactFieldName"], ["email", "lpContactFieldEmail"], ["phone", "lpContactFieldPhone"]] as const;

export function ContactForm({ onSubmit, submitting, errorCode }: {
  onSubmit: (v: ContactInput) => void; submitting: boolean; errorCode?: string;
}) {
  const { t } = useI18n();
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [errs, setErrs] = useState<Record<string, TranslationKey>>({});
  const fld = "mt-1 w-full rounded-lg border border-[color:var(--glass-border)] bg-transparent p-3 text-sm disabled:opacity-50";
  function go(e: React.FormEvent) {
    e.preventDefault();
    const r = contactSchema.safeParse(f);
    if (!r.success) { const m: Record<string, TranslationKey> = {}; for (const i of r.error.issues) { const k = String(i.path[0]); if (VMSG[k]) m[k] = VMSG[k]!; } setErrs(m); return; }
    setErrs({}); onSubmit(r.data);
  }
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <form onSubmit={go} className="space-y-3">
      {errorCode && <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{t(EMSG[errorCode] ?? "lpContactErrorNetwork")}</div>}
      {FIELDS.map(([k, lbl]) => (
        <label key={k} className="block text-sm font-medium">{t(lbl)}
          <input value={f[k]} disabled={submitting} onChange={(e) => set(k, e.target.value)} className={fld} />
          {errs[k] && <span className="text-xs text-destructive">{t(errs[k]!)}</span>}
        </label>))}
      <label className="block text-sm font-medium">{t("lpContactFieldMessage")}
        <textarea value={f.message} disabled={submitting} onChange={(e) => set("message", e.target.value)} rows={4} className={fld} />
        {errs.message && <span className="text-xs text-destructive">{t(errs.message)}</span>}</label>
      <FloatingButton type="submit" variant="primary" size="lg" disabled={submitting}>{submitting ? t("lpContactSubmitting") : t("lpContactSubmit")}</FloatingButton>
    </form>
  );
}
