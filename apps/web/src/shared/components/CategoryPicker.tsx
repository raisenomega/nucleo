import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";

type Cat = { id: string; label: string };
const CLASSES: { v: string; k: TranslationKey }[] = [
  { v: "fixed", k: "fixedExpense" }, { v: "variable", k: "variableExpense" },
  { v: "debt", k: "debtExpense" }, { v: "one_time", k: "oneTimeExpense" },
];
// Mapea el kind de categoría al módulo del gate: quien puede crear en el módulo puede crear categorías.
const MOD: Record<string, string> = { income: "income", expense: "expenses", payment_method: "income", channel: "marketing" };

// Selector de categoría reutilizable con creación inline gateada por can(módulo,"create").
export function CategoryPicker({ kind, value, onChange, label, byLabel }: {
  kind: string; value: string; onChange: (v: string) => void; label: TranslationKey; byLabel?: boolean;
}) {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const [cats, setCats] = useState<Cat[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [cls, setCls] = useState("fixed");
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const load = () => void supabase.from("categories").select("id,label").eq("kind", kind).eq("active", true).order("sort")
    .then(({ data }) => setCats((data as Cat[] | null) ?? []));
  useEffect(() => { load(); }, [kind]);
  async function create() {
    if (!name.trim()) return;
    const row: Record<string, unknown> = { kind, label: name.trim(), sort: 99 };
    if (kind === "expense") row.expense_class = cls;
    const { data } = await supabase.from("categories").insert(row).select("id").single();
    const id = (data as { id: string } | null)?.id;
    if (id) { load(); onChange(byLabel ? name.trim() : id); setName(""); setCreating(false); }
  }
  return (
    <label className="block space-y-1">
      <span className="text-xs font-bold text-muted-foreground">{t(label)}</span>
      {creating ? (
        <div className="space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("categoryName")} className={field} />
          {kind === "expense" && (
            <select value={cls} onChange={(e) => setCls(e.target.value)} className={field} aria-label={t("selectExpenseClass")}>
              {CLASSES.map((c) => <option key={c.v} value={c.v}>{t(c.k)}</option>)}
            </select>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => void create()} className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-bold">{t("createCategory")}</button>
            <button type="button" onClick={() => setCreating(false)} className="text-xs text-muted-foreground">{t("cancel")}</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select value={value} onChange={(e) => onChange(e.target.value)} className={field}>
            <option value="">—</option>{cats.map((c) => <option key={c.id} value={byLabel ? c.label : c.id}>{c.label}</option>)}
          </select>
          {can(MOD[kind] ?? "income", "create") && <button type="button" onClick={() => setCreating(true)} className="shrink-0 rounded-lg border border-border p-2 text-primary" aria-label={t("newCategory")}><Plus className="h-4 w-4" /></button>}
        </div>
      )}
    </label>
  );
}
