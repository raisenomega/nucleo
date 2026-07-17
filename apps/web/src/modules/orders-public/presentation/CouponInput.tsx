import { useState } from "react";
import { Check, X } from "lucide-react";
import { useI18n } from "@shared/i18n";

// Input de cupón + feedback. Con código aplicado (activeCode), el badge refleja el preview server-autoritativo:
// discount>0 → verde "aplicado −$X"; discount===0 → rojo "inválido o expirado". Botón "Quitar".
export function CouponInput({ onApply, discount, activeCode }: { onApply: (code: string | null) => void; discount: number; activeCode: string | null }) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  if (activeCode) {
    const ok = discount > 0;
    return (
      <div className={`flex items-center justify-between gap-2 rounded-lg border p-2 text-sm ${ok ? "border-green-300 bg-green-50 dark:border-green-500/30 dark:bg-green-500/10" : "border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"}`}>
        <span className={`inline-flex items-center gap-1 font-medium ${ok ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
          {ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {ok ? t("opCouponApplied", { amount: `$${discount.toFixed(2)}` }) : t("opCouponInvalid")}
        </span>
        <button type="button" onClick={() => { setCode(""); onApply(null); }} className="shrink-0 text-xs font-medium text-muted-foreground underline">{t("opCouponRemove")}</button>
      </div>);
  }
  return (
    <div className="flex items-end gap-2">
      <label className="flex-1"><span className="mb-1 block text-sm font-medium text-foreground">{t("opCoupon")}</span>
        <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-lg border border-border bg-background p-2 text-sm" /></label>
      <button type="button" onClick={() => { if (code.trim()) onApply(code.trim()); }} disabled={!code.trim()}
        className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50">{t("opCouponApply")}</button>
    </div>
  );
}
