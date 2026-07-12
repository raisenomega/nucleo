import { useState } from "react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { Spinner } from "@shared/components/loading";
import { isReady } from "@shared/types/fetch-state.types";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";
import { InterestedItemDropdown } from "@landing-public/presentation/contact/InterestedItemDropdown";
import { useLandingCatalogItems } from "@landing-public/presentation/useLandingCatalogItems.hook";
import { contactSchema, type ContactInput } from "@landing-public/presentation/contact/contact-form.schema";
import type { InterestedItem } from "@landing-public/domain/interested-item.types";

const VMSG: Record<string, TranslationKey> = { name: "lpContactValidationName", email: "lpContactValidationEmail", message: "lpContactValidationMessage" };
const EMSG: Record<string, TranslationKey> = { rate_limited: "lpContactErrorRateLimit", invalid_payload: "lpContactErrorInvalid", quote_incomplete: "lpContactErrorInvalid", origin_not_allowed: "lpContactErrorOrigin" };
const FIELDS = [["name", "lpContactFieldName"], ["email", "lpContactFieldEmail"], ["phone", "lpContactFieldPhone"]] as const;

export function ContactForm({ onSubmit, submitting, errorCode, preselectedItem }: {
  onSubmit: (v: ContactInput, interested: InterestedItem | null) => void; submitting: boolean; errorCode?: string; preselectedItem?: InterestedItem;
}) {
  const { t } = useI18n();
  const catalog = useLandingCatalogItems();
  const { products, services, packages } = isReady(catalog) ? catalog.data : { products: [], services: [], packages: [] };
  const [item, setItem] = useState<InterestedItem | null>(preselectedItem ?? null);
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [errs, setErrs] = useState<Record<string, TranslationKey>>({});
  const fld = "mt-1 w-full rounded-lg border border-[color:var(--glass-border)] bg-transparent p-3 text-sm disabled:opacity-50";
  function go(e: React.FormEvent) {
    e.preventDefault();
    const r = contactSchema.safeParse(f);
    if (!r.success) { const m: Record<string, TranslationKey> = {}; for (const i of r.error.issues) { const k = String(i.path[0]); if (VMSG[k]) m[k] = VMSG[k]!; } setErrs(m); return; }
    setErrs({}); onSubmit(r.data, item);
  }
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <form onSubmit={go} className="space-y-3">
      {errorCode && <div className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{t(EMSG[errorCode] ?? "lpContactErrorNetwork")}</div>}
      <InterestedItemDropdown value={item} onChange={setItem} products={products} services={services} packages={packages} disabled={submitting} />
      {FIELDS.map(([k, lbl]) => (
        <label key={k} className="block text-sm font-medium">{t(lbl)}
          <input value={f[k]} disabled={submitting} onChange={(e) => set(k, e.target.value)} className={fld} />
          {errs[k] && <span className="text-xs text-destructive">{t(errs[k]!)}</span>}
        </label>))}
      <label className="block text-sm font-medium">{t("lpContactFieldMessage")}
        <textarea value={f.message} disabled={submitting} onChange={(e) => set("message", e.target.value)} rows={4} className={fld}
          placeholder={item ? t("lpContactMessagePlaceholder", { item: item.name }) : undefined} />
        {errs.message && <span className="text-xs text-destructive">{t(errs.message)}</span>}</label>
      <FloatingButton type="submit" variant="primary" size="lg" disabled={submitting}>{submitting ? <span className="inline-flex items-center gap-2"><Spinner size="sm" label={t("lpContactSubmitting")} />{t("lpContactSubmitting")}</span> : t("lpContactSubmit")}</FloatingButton>
    </form>
  );
}
