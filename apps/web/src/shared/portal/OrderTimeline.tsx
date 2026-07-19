import { Check } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ORDER_STEPS, STATUS_LABEL, stepOf } from "@shared/portal/order-status";

// Timeline visual de estados de la orden (pendiente → pago → confirmación → pagada).
export function OrderTimeline({ status }: { status: string }) {
  const { t } = useI18n();
  const cur = stepOf(status);
  return (
    <div className="flex items-start gap-1">
      {ORDER_STEPS.map((s, i) => (
        <div key={s} className="flex flex-1 flex-col items-center gap-1">
          <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${i <= cur ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {i <= cur ? <Check className="h-3 w-3" /> : i + 1}
          </span>
          <span className="text-center text-[10px] leading-tight text-muted-foreground">{t(STATUS_LABEL[s]!)}</span>
        </div>
      ))}
    </div>
  );
}
