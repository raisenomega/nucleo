import { useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { ORDER_STATUSES, type OrderFilters, type OrderStatus } from "@orders/domain/order.types";
import { STATUS_LABEL } from "@orders/presentation/order-status.const";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const ago = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const monthStart = () => { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth(), 1)); };
const PRESETS: { key: "ordDateToday" | "ordDate7" | "ordDate30" | "ordDateMonth" | "ordDateAll"; from: string }[] = [
  { key: "ordDateToday", from: iso(new Date()) }, { key: "ordDate7", from: ago(7) },
  { key: "ordDate30", from: ago(30) }, { key: "ordDateMonth", from: monthStart() }, { key: "ordDateAll", from: "" },
];

export function OrdersFilters({ filters, setStatus, setFrom, setQ }: {
  filters: OrderFilters; setStatus: (s: OrderStatus[]) => void; setFrom: (from: string) => void; setQ: (q: string) => void;
}) {
  const { t } = useI18n();
  const [q, setLocalQ] = useState(filters.q);
  useEffect(() => { const id = setTimeout(() => setQ(q), 300); return () => clearTimeout(id); }, [q, setQ]);
  const toggle = (s: OrderStatus) => setStatus(filters.status.includes(s) ? filters.status.filter((x) => x !== s) : [...filters.status, s]);
  const chip = (active: boolean) => `rounded-full px-3 py-1 text-xs font-medium ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`;
  return (
    <div className="space-y-2">
      <input value={q} onChange={(e) => setLocalQ(e.target.value)} placeholder={t("ordSearchPlaceholder")} className="w-full rounded-lg border border-border bg-background p-2 text-sm md:max-w-xs" />
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setStatus([])} className={chip(filters.status.length === 0)}>{t("ordFilterAll")}</button>
        {ORDER_STATUSES.map((s) => <button key={s} type="button" onClick={() => toggle(s)} className={chip(filters.status.includes(s))}>{t(STATUS_LABEL[s])}</button>)}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => <button key={p.key} type="button" onClick={() => setFrom(p.from)} className={chip(filters.from === p.from)}>{t(p.key)}</button>)}
      </div>
    </div>
  );
}
