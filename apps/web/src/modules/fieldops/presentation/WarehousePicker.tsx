import { useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";

// Selector de almacén reutilizable (self-load, patrón UomPicker). Auto-selecciona el default si value vacío;
// se oculta si hay uno solo (hideIfSingle). `exclude` filtra un almacén (ej. el origen en el transfer).
type Wh = { id: string; name: string; code: string; is_default: boolean };
export function WarehousePicker({ value, onChange, label, hideIfSingle, exclude }: {
  value: string; onChange: (v: string) => void; label?: string; hideIfSingle?: boolean; exclude?: string;
}) {
  const { t } = useI18n();
  const [whs, setWhs] = useState<Wh[]>([]);
  useEffect(() => { void supabase.from("warehouses").select("id,name,code,is_default").is("deleted_at", null).order("is_default", { ascending: false }).order("name").then(({ data }) => setWhs((data as Wh[] | null) ?? [])); }, []);
  const opts = whs.filter((w) => w.id !== exclude);
  // auto-selecciona el default si value está vacío O quedó fuera de opciones (ej. el "hacia" que excluye el "desde").
  useEffect(() => { const pick = opts.find((w) => w.is_default) ?? opts[0]; if (pick && !opts.some((w) => w.id === value)) onChange(pick.id); }, [value, whs, exclude]);
  if (hideIfSingle && opts.length <= 1) return null;
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold text-muted-foreground">{label ?? t("warehouse")}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-background p-2 text-sm">
        {!value && <option value="">—</option>}
        {opts.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.code}){w.is_default ? " ★" : ""}</option>)}
      </select>
    </label>
  );
}
