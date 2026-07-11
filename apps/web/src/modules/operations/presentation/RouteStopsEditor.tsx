import { Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { CategoryPicker } from "@shared/components/CategoryPicker";
import type { EditableStop } from "@operations/domain/route.types";

export const emptyStop = (): EditableStop => ({ clientName: "", address: "", city: "", serviceType: "", scheduledTime: "", estimatedAmount: 0, notes: "", phone: "" });

// Editor en memoria de paradas (crear o editar). Conserva el id de las existentes. service_type = categorías.
export function RouteStopsEditor({ stops, onChange }: { stops: EditableStop[]; onChange: (s: EditableStop[]) => void }) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  const set = (i: number, k: keyof EditableStop, v: string | number) => onChange(stops.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  return (
    <div className="space-y-2">
      {stops.map((s, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between text-xs"><span className="font-bold text-foreground">#{i + 1}</span>
            <button type="button" onClick={() => onChange(stops.filter((_, x) => x !== i))} className="text-destructive"><Trash2 className="h-4 w-4" /></button></div>
          <div className="grid grid-cols-2 gap-2">
            <input value={s.clientName} onChange={(e) => set(i, "clientName", e.target.value)} placeholder={t("contactName")} className={fld} />
            <input value={s.phone} onChange={(e) => set(i, "phone", e.target.value)} placeholder={t("phone")} className={fld} />
            <input value={s.city} onChange={(e) => set(i, "city", e.target.value)} placeholder={t("city")} className={`${fld} col-span-2`} />
            <input value={s.address} onChange={(e) => set(i, "address", e.target.value)} placeholder={t("address")} className={`${fld} col-span-2`} />
            <div className="col-span-2"><CategoryPicker kind="service_type" byLabel value={s.serviceType} onChange={(v) => set(i, "serviceType", v)} label="serviceRequested" /></div>
            <div className="col-span-2 flex items-center gap-2"><span className={lbl}>{t("scheduledTime")}</span>
              <input type="time" value={s.scheduledTime.slice(0, 5)} onChange={(e) => set(i, "scheduledTime", e.target.value)}
                className="rounded-lg border border-border bg-background p-2 text-sm" /></div>
            <input type="number" step="0.01" min="0" value={s.estimatedAmount || ""} onChange={(e) => set(i, "estimatedAmount", Number(e.target.value))} placeholder={t("amount")} className={`${fld} col-span-2`} />
            <textarea value={s.notes} onChange={(e) => set(i, "notes", e.target.value)} placeholder={t("serviceDescription")} rows={2} className={`${fld} col-span-2`} />
          </div>
        </div>
      ))}
    </div>
  );
}
