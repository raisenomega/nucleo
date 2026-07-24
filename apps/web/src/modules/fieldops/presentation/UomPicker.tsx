import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";

type Uom = { id: string; name: string; abbreviation: string };
const GROUPS: TranslationKey[] = ["count", "volume", "weight", "length", "area", "time", "other"];

// Selector de UOM reutilizable (patrón CategoryPicker). Muestra "nombre (abrev)" + crear inline. Gateado por inventory:edit.
export function UomPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const [uoms, setUoms] = useState<Uom[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState(""); const [abbr, setAbbr] = useState(""); const [grp, setGrp] = useState("count");
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const load = () => void supabase.from("units_of_measure").select("id,name,abbreviation").eq("active", true).order("name")
    .then(({ data }) => setUoms((data as Uom[] | null) ?? []));
  useEffect(() => { load(); }, []);
  async function create() {
    if (!name.trim() || !abbr.trim()) return;
    const { data } = await supabase.from("units_of_measure").insert({ name: name.trim(), abbreviation: abbr.trim(), uom_group: grp }).select("id").single();
    const id = (data as { id: string } | null)?.id;
    if (id) { load(); onChange(id); setName(""); setAbbr(""); setCreating(false); }
  }
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold text-muted-foreground">{t("unitOfMeasure")}</span>
      {creating ? (
        <div className="space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name")} className={field} />
          <input value={abbr} onChange={(e) => setAbbr(e.target.value)} placeholder={t("abbreviation")} className={field} />
          <select value={grp} onChange={(e) => setGrp(e.target.value)} className={field} aria-label={t("uomGroup")}>
            {GROUPS.map((g) => <option key={g} value={g}>{t(g)}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={() => void create()} className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-bold">{t("createUnit")}</button>
            <button type="button" onClick={() => setCreating(false)} className="text-xs text-muted-foreground">{t("cancel")}</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select value={value} onChange={(e) => onChange(e.target.value)} className={field}>
            <option value="">—</option>
            {uoms.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
          </select>
          {can("inventory", "edit") && <button type="button" onClick={() => setCreating(true)} className="shrink-0 rounded-lg border border-border p-2 text-foreground" aria-label={t("createUnit")}><Plus className="h-4 w-4" /></button>}
        </div>
      )}
    </label>
  );
}
