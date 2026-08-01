import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { ScreenModal } from "@shared/components/ScreenModal";
import { Spinner } from "@shared/components/loading/Spinner";
import { useOrderForm } from "@orders-public/presentation/useOrderForm.hook";
import { useCreateOrder } from "@orders-public/presentation/useCreateOrder.hook";
import { useOrderPricing } from "@orders-public/presentation/useOrderPricing.hook";
import { OrderFormRenderer } from "@orders-public/presentation/OrderFormRenderer";
import { OrderSubmitBar } from "@orders-public/presentation/OrderSubmitBar";
import { PaymentMethodPicker } from "@orders-public/presentation/PaymentMethodPicker";
import { CouponInput } from "@orders-public/presentation/CouponInput";
import { OrderSuccessDialog } from "@orders-public/presentation/OrderSuccessDialog";
import { PromoOrderHeader, type PromoHeaderCtx } from "@orders-public/presentation/PromoOrderHeader";
import { OfferDisclosureBlock, type OfferCtx } from "@orders-public/presentation/OfferDisclosureBlock";
import { FormTermsBlock } from "@orders-public/presentation/FormTermsBlock";
import { firstInvalidField } from "@orders-public/domain/validate-order";

export interface OrderItem { kind: "product" | "service" | "package"; id: string; name: string; basePrice: number }
const ERR: Record<string, string> = { total_mismatch: "opErrTotal", rate_limited: "opErrRate", coupon_invalid: "opErrCoupon", payment_method_invalid: "opErrPayment", form_invalid: "opErrForm" };
const bar = "sticky z-10 border-border bg-card/85 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/70";

export function OrderModal({ item, onClose, defaultValues, defaultCoupon, promoContext, offerContext }: { item: OrderItem; onClose: () => void; defaultValues?: Record<string, unknown>; defaultCoupon?: string | null; promoContext?: PromoHeaderCtx; offerContext?: OfferCtx }) {
  const { t, locale } = useI18n(); const toast = useToast();
  const { form, methods, status, payConfig } = useOrderForm(item.kind, item.id); const { busy, submit, checkout } = useCreateOrder();
  const [values, setValues] = useState<Record<string, unknown>>({}); const [accepted, setAccepted] = useState(false);
  const [pm, setPm] = useState(""); const [coupon, setCoupon] = useState<string | null>(defaultCoupon ?? null);
  const [done, setDone] = useState<{ orderNumber: string; orderId: string } | null>(null); const [redirecting, setRedirecting] = useState(false);
  // isSub (form con campo 'frequency') → checkout de suscripción; one-time → checkout normal. Ambos con Stripe si está activo.
  const isSub = form?.fields.some((f) => f.fieldKey === "frequency") ?? false; const useStripe = payConfig?.stripeEnabled ?? false;
  useEffect(() => { if (!useStripe && methods[0] && !pm) setPm(methods[0].methodKey); }, [methods, pm, useStripe]);
  useEffect(() => { if (form) setValues({ ...Object.fromEntries(form.fields.filter((f) => f.validation.default !== undefined).map((f) => [f.fieldKey, f.validation.default])), ...defaultValues }); }, [form]);
  const items = [{ kind: item.kind, id: item.id, qty: 1, name: item.name }]; const totals = useOrderPricing(item, values, coupon);
  const formTerms = ((!offerContext && (locale === "en" ? form?.termsEn : form?.termsEs)) || "").replace(/^(PENDIENTE_|PENDING_).*/s, "") || null; // contrato firmable del form; PENDIENTE_/PENDING_ = placeholder de infra (no se firma)
  async function onSubmit() {
    if (!form) return;
    const bad = firstInvalidField(form.fields, values); // bloqueante: toast educativo, no se envía la orden.
    if (bad) { const msg = (locale === "en" ? bad.validation.error_en : bad.validation.error_es) as string | undefined; return toast.error(msg || t("checkoutRequiredField")); }
    const r = await submit({ formId: form.id, items, customFields: values, paymentMethodKey: useStripe ? "stripe" : pm, couponCode: coupon, clientTotal: totals.total, offerId: offerContext?.offerId ?? null });
    if (!r.ok) return toast.error(t((ERR[r.code] ?? "opErrNetwork") as Parameters<typeof t>[0]));
    if (useStripe) { // crea la orden pending → redirige a Stripe Checkout (suscripción o one-time); el webhook confirma.
      setRedirecting(true); const url = r.publicToken ? await checkout(r.publicToken, isSub) : null;
      if (url) window.location.assign(url); else { setRedirecting(false); toast.error(t("payError")); }
      return;
    }
    setDone({ orderNumber: r.orderNumber, orderId: r.orderId });
  }
  if (done) return <OrderSuccessDialog orderNumber={done.orderNumber} orderId={done.orderId} method={methods.find((m) => m.methodKey === pm) ?? null} total={totals.total} itemName={item.name} onClose={onClose} />;
  return (
    <ScreenModal onClose={onClose}>
      <div className={`${bar} top-0 flex items-center justify-between border-b`}>
        <h2 className="hidden font-display text-lg font-bold text-foreground md:block">{t("opTitle")}: {item.name}</h2>
        <button type="button" onClick={onClose} aria-label={t("opClose")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        {status === "loading" && <div className="py-8"><Spinner /></div>}
        {status === "notfound" && <p className="py-6 text-center text-sm text-muted-foreground">{t("opErrForm")}</p>}
        {status === "ready" && form && (
          <>
            {promoContext && <PromoOrderHeader {...promoContext} />}
            {offerContext && <OfferDisclosureBlock offer={offerContext} recurring={totals.total} accepted={accepted} onAccept={setAccepted} />}
            {formTerms && <FormTermsBlock terms={formTerms} accepted={accepted} onAccept={setAccepted} />}
            <OrderFormRenderer fields={form.fields} values={values} onChange={(k, v) => setValues((p) => ({ ...p, [k]: v }))} />
            <CouponInput onApply={setCoupon} discount={totals.discount} activeCode={coupon} />
            {!useStripe && <PaymentMethodPicker methods={methods} value={pm} onChange={setPm} />}
          </>
        )}
      </div>
      {status === "ready" && form && (
        <OrderSubmitBar form={form} totals={totals} promoContext={promoContext} busy={busy} redirecting={redirecting} useStripe={useStripe} isSub={isSub} pm={pm} locale={locale} blocked={(!!offerContext || !!formTerms) && !accepted} offerHook={offerContext?.hookPrice ?? null} offerAccepted={accepted} onSubmit={() => void onSubmit()} onClose={onClose} />
      )}
    </ScreenModal>
  );
}
