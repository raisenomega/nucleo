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
import { OrderTotalPreview } from "@orders-public/presentation/OrderTotalPreview";
import { OrderDynamicSummary } from "@orders-public/presentation/OrderDynamicSummary";
import { PaymentMethodPicker } from "@orders-public/presentation/PaymentMethodPicker";
import { CouponInput } from "@orders-public/presentation/CouponInput";
import { OrderSuccessDialog } from "@orders-public/presentation/OrderSuccessDialog";
import { firstInvalidField } from "@orders-public/domain/validate-order";

export interface OrderItem { kind: "product" | "service" | "package"; id: string; name: string; basePrice: number }
const ERR: Record<string, string> = { total_mismatch: "opErrTotal", rate_limited: "opErrRate", coupon_invalid: "opErrCoupon", payment_method_invalid: "opErrPayment", form_invalid: "opErrForm" };
const bar = "sticky z-10 border-border bg-card/85 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/70";

export function OrderModal({ item, onClose, defaultValues, defaultCoupon }: { item: OrderItem; onClose: () => void; defaultValues?: Record<string, unknown>; defaultCoupon?: string | null }) {
  const { t, locale } = useI18n(); const toast = useToast();
  const { form, methods, status } = useOrderForm(item.kind, item.id);
  const { busy, submit } = useCreateOrder();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [pm, setPm] = useState(""); const [coupon, setCoupon] = useState<string | null>(defaultCoupon ?? null);
  const [done, setDone] = useState<{ orderNumber: string; orderId: string } | null>(null);
  useEffect(() => { if (methods[0] && !pm) setPm(methods[0].methodKey); }, [methods, pm]);
  // Semilla de valores desde validation_rules.default (frequency='4w', extraBuriedBins='2'…) → el preview de la
  // matriz calcula desde que abre y responde al cambiar frecuencia (antes arrancaba vacío → matriz devolvía $0).
  useEffect(() => { if (form) setValues({ ...Object.fromEntries(form.fields.filter((f) => f.validation.default !== undefined).map((f) => [f.fieldKey, f.validation.default])), ...defaultValues }); }, [form]);
  const items = [{ kind: item.kind, id: item.id, qty: 1, name: item.name }];
  const totals = useOrderPricing(item, values, coupon);
  async function onSubmit() {
    if (!form) return;
    const bad = firstInvalidField(form.fields, values); // bloqueante: toast educativo, no se envía la orden.
    if (bad) { const msg = (locale === "en" ? bad.validation.error_en : bad.validation.error_es) as string | undefined; return toast.error(msg || t("checkoutRequiredField")); }
    const r = await submit({ formId: form.id, items, customFields: values, paymentMethodKey: pm, couponCode: coupon, clientTotal: totals.total });
    if (r.ok) setDone({ orderNumber: r.orderNumber, orderId: r.orderId }); else toast.error(t((ERR[r.code] ?? "opErrNetwork") as Parameters<typeof t>[0]));
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
            <OrderFormRenderer fields={form.fields} values={values} onChange={(k, v) => setValues((p) => ({ ...p, [k]: v }))} />
            <CouponInput onApply={setCoupon} discount={totals.discount} activeCode={coupon} />
            <PaymentMethodPicker methods={methods} value={pm} onChange={setPm} />
          </>
        )}
      </div>
      {status === "ready" && form && (
        <div className={`${bar} bottom-0 space-y-3 border-t`}>
          {form.showSummary
            ? <OrderDynamicSummary totals={totals} title={t("opSummaryTitle")} footer={locale === "en" ? form.summaryFooterEn : form.summaryFooterEs} />
            : <OrderTotalPreview totals={totals} />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-3 font-bold text-foreground">{(locale === "en" ? form.cancelLabelEn : form.cancelLabelEs) || t("opCancel")}</button>
            <button type="button" disabled={busy || !pm} onClick={() => void onSubmit()} className="flex-1 rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50">
              {busy ? t("opSubmitting") : (locale === "en" ? form.submitLabelEn : form.submitLabelEs) || t("opSubmit")}
            </button>
          </div>
        </div>
      )}
    </ScreenModal>
  );
}
