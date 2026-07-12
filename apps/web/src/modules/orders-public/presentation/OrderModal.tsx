import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { ScreenModal } from "@shared/components/ScreenModal";
import { Spinner } from "@shared/components/loading/Spinner";
import { useOrderForm } from "@orders-public/presentation/useOrderForm.hook";
import { useCreateOrder } from "@orders-public/presentation/useCreateOrder.hook";
import { computeTotal } from "@orders-public/application/order-pricing";
import { OrderFormRenderer } from "@orders-public/presentation/OrderFormRenderer";
import { OrderTotalPreview } from "@orders-public/presentation/OrderTotalPreview";
import { PaymentMethodPicker } from "@orders-public/presentation/PaymentMethodPicker";
import { CouponInput } from "@orders-public/presentation/CouponInput";
import { OrderSuccessDialog } from "@orders-public/presentation/OrderSuccessDialog";

export interface OrderItem { kind: "product" | "service" | "package"; id: string; name: string; basePrice: number }
const ERR: Record<string, string> = { total_mismatch: "opErrTotal", rate_limited: "opErrRate", coupon_invalid: "opErrCoupon", payment_method_invalid: "opErrPayment", form_invalid: "opErrForm" };

export function OrderModal({ item, onClose }: { item: OrderItem; onClose: () => void }) {
  const { t } = useI18n(); const toast = useToast();
  const { form, methods, rules, status } = useOrderForm(item.kind, item.id);
  const { busy, submit } = useCreateOrder();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [pm, setPm] = useState(""); const [coupon, setCoupon] = useState<string | null>(null);
  const [done, setDone] = useState<{ orderNumber: string; orderId: string } | null>(null);
  useEffect(() => { if (methods[0] && !pm) setPm(methods[0].methodKey); }, [methods, pm]);
  const items = [{ kind: item.kind, id: item.id, qty: 1, name: item.name }];
  const totals = rules ? computeTotal(items, values, rules, () => item.basePrice) : { subtotal: item.basePrice, tax: 0, shipping: 0, total: item.basePrice };
  async function onSubmit() {
    if (!form) return;
    const r = await submit({ formId: form.id, items, customFields: values, paymentMethodKey: pm, couponCode: coupon, clientTotal: totals.total });
    if (r.ok) setDone({ orderNumber: r.orderNumber, orderId: r.orderId }); else toast.error(t((ERR[r.code] ?? "opErrNetwork") as Parameters<typeof t>[0]));
  }
  if (done) return <OrderSuccessDialog orderNumber={done.orderNumber} orderId={done.orderId} method={methods.find((m) => m.methodKey === pm) ?? null} total={totals.total} itemName={item.name} onClose={onClose} />;
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("opTitle")}: {item.name}</h2>
        <button type="button" onClick={onClose} aria-label={t("opClose")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        {status === "loading" && <div className="py-8"><Spinner /></div>}
        {status === "notfound" && <p className="py-6 text-center text-sm text-muted-foreground">{t("opErrForm")}</p>}
        {status === "ready" && form && (
          <>
            <OrderFormRenderer fields={form.fields} values={values} onChange={(k, v) => setValues((p) => ({ ...p, [k]: v }))} />
            <CouponInput onApply={setCoupon} />
            <PaymentMethodPicker methods={methods} value={pm} onChange={setPm} />
            <OrderTotalPreview totals={totals} />
            <button type="button" disabled={busy || !pm} onClick={() => void onSubmit()} className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50">
              {busy ? t("opSubmitting") : t("opSubmit")}
            </button>
          </>
        )}
      </div>
    </ScreenModal>
  );
}
