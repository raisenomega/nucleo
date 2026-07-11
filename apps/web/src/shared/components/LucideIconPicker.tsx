import { useState } from "react";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";

const MAP = Icons as unknown as Record<string, LucideIcon>;

// ~50 iconos curados para categorías/servicios. Devuelve el nombre (string) del icono.
const CURATED = [
  "Package","Wrench","Home","ShoppingCart","Truck","Sparkles","Droplets","Trash2","Recycle","Hammer",
  "Paintbrush","Leaf","Sun","Zap","Shield","Star","Heart","Gift","Tag","Box",
  "Building2","Store","Factory","Warehouse","Container","Boxes","Wind","Flame","Waves","TreePine",
  "Bug","SprayCan","Bath","Brush","Trash","Construction","Drill","Pipette","Fan","Snowflake",
];

export function LucideIconPicker({ value, onChange }: { value: string | null; onChange: (name: string) => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const Current = (value && MAP[value]) || Icons.HelpCircle;
  const list = CURATED.filter((n) => n.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
        <Current className="h-4 w-4" /> {value ?? t("selectIcon")}</button>
      {open && <ScreenModal onClose={() => setOpen(false)}>
        <div className="space-y-3 p-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")}
            className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
          <div className="grid grid-cols-6 gap-2 md:grid-cols-8">
            {list.map((n) => {
              const Ic = MAP[n] ?? Icons.HelpCircle;
              return <button key={n} type="button" title={n} onClick={() => { onChange(n); setOpen(false); }}
                className="grid aspect-square place-items-center rounded-lg border border-border hover:bg-secondary">
                <Ic className="h-5 w-5" /></button>;
            })}
          </div>
        </div>
      </ScreenModal>}
    </>
  );
}
