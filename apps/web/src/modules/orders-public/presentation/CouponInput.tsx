import { useState } from "react";
import { useI18n } from "@shared/i18n";

export function CouponInput({ onApply }: { onApply: (code: string | null) => void }) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);
  return (
    <div className="flex items-end gap-2">
      <label className="flex-1"><span className="mb-1 block text-sm font-medium text-foreground">{t("opCoupon")}</span>
        <input value={code} onChange={(e) => { setCode(e.target.value); setApplied(false); onApply(null); }} disabled={applied}
          className="w-full rounded-lg border border-border bg-background p-2 text-sm" /></label>
      <button type="button" onClick={() => { if (code.trim()) { setApplied(true); onApply(code.trim()); } }}
        className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground disabled:opacity-50" disabled={applied || !code.trim()}>
        {t("opCouponApply")}
      </button>
    </div>
  );
}
